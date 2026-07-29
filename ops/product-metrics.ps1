[CmdletBinding()]
param(
    [switch]$Local
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$SqlPath = Join-Path $PSScriptRoot "product-metrics.sql"
$Wrangler = Join-Path $RepoRoot "node_modules\.bin\wrangler.cmd"
$Target = if ($Local) { "--local" } else { "--remote" }
$Sql = (Get-Content $SqlPath) -join " "

$Output = & $Wrangler d1 execute yorishiru $Target --json --command $Sql
if ($LASTEXITCODE -ne 0) {
    throw "D1 metrics query failed with exit code $LASTEXITCODE"
}

$Payload = ($Output -join [Environment]::NewLine) | ConvertFrom-Json
$Row = $Payload[0].results[0]
if (-not $Row) {
    throw "D1 metrics query returned no result"
}

function Get-Percent {
    param(
        [int]$Numerator,
        [int]$Denominator
    )

    if ($Denominator -eq 0) { return 0.0 }
    return [Math]::Round(($Numerator / $Denominator) * 100, 1)
}

$Users = [int]$Row.users
$Creators = [int]$Row.creators

[ordered]@{
    generated_at = [DateTimeOffset]::UtcNow.ToString("o")
    service = "yorishiru"
    environment = if ($Local) { "local" } else { "production" }
    funnel = [ordered]@{
        users = $Users
        creators = $Creators
        editors = [int]$Row.editors
        sharers = [int]$Row.sharers
        viewers = [int]$Row.viewers
        outbound_users = [int]$Row.outbound_users
        mark_users = [int]$Row.mark_users
        exporters = [int]$Row.exporters
        referred_creators = [int]$Row.referred_creators
        returned = [int]$Row.returned
        users_7d = [int]$Row.users_7d
        creators_7d = [int]$Row.creators_7d
    }
    product = [ordered]@{
        active_profiles = [int]$Row.active_profiles
        edited_profiles = [int]$Row.edited_profiles
        discoverable_profiles = [int]$Row.discoverable_profiles
        profiles_with_sections = [int]$Row.profiles_with_sections
        profiles_with_links = [int]$Row.profiles_with_links
    }
    rates = [ordered]@{
        create_percent = Get-Percent $Creators $Users
        edit_percent = Get-Percent ([int]$Row.editors) $Creators
        share_percent = Get-Percent ([int]$Row.sharers) $Creators
        outbound_percent = Get-Percent ([int]$Row.outbound_users) ([int]$Row.viewers)
        referral_percent = Get-Percent ([int]$Row.referred_creators) ([int]$Row.viewers)
        return_percent = Get-Percent ([int]$Row.returned) $Users
    }
} | ConvertTo-Json -Depth 4
