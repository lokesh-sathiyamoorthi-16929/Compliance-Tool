# ADManager Plus API v2 Columns Reference (ComplianceIQ Canonical)

**Source:** `https://www.manageengine.com/products/ad-manager/active-directory-api/v2/`  
**Rule:** Use **Column Name** (not LDAP name) in `filter`, `sort`, and `fields` parameters.

> Note: This repository currently captures the verified key column sets below from the human-supplied spec. Add the full LDAP→Column Search/Response/Description tables from the official "API search and response columns" page here verbatim when that full source table is provided in-session.

## Users — key columns we'll use

| Column Name | Search? | Use |
|---|---|---|
| `ACCOUNT_STATUS` | No | Enabled / Disabled / Locked |
| `ACCOUNT_EXPIRY_DATE` | No | Account expiry |
| `LAST_LOGON_TIME` | No | Last successful logon |
| `DAYS_SINCE_LAST_LOGON` | No | Stale-account metric |
| `LOCK_OUT_TIME` | No | Currently locked out? |
| `BAD_PASSWORD_COUNT` | No | Failed login attempts |
| `PWD_NEV_EXP_FLAG` | No | Password set to never expire (red flag) |
| `PASSWORD_EXPIRY_DATE` | No | When password expires |
| `DAYS_TO_EXPIRE_PASSWORD` | No | Countdown |
| `SMART_CARD_FOR_INTERACTIVE_LOGIN` | No | Smartcard required (good) |
| `MEMBER_OF` | No | Group memberships (privileged-user join) |
| `SAM_ACCOUNT_NAME`, `LOGON_NAME`, `DISPLAY_NAME`, `EMAIL_ADDRESS`, `EMPLOYEE_ID`, `DEPARTMENT`, `TITLE`, `MANAGER`, `OU_NAME`, `DOMAIN_NAME`, `OBJECT_GUID`, `SID_STRING` | Mostly Yes | Identity / org context |

## Groups — key columns

| Column Name | Use |
|---|---|
| `GROUP_NAME`, `SAM_ACCOUNT_NAME` | Identity |
| `GROUP_TYPE` | Security / Distribution |
| `GROUP_SCOPE` | Domain Local / Global / Universal |
| `MEMBER_OF` | Nested group membership |
| `MANAGER` | Owner |
| `DISTINGUISHED_NAME`, `OBJECT_GUID`, `SID_STRING`, `OU_NAME`, `DOMAIN_NAME` | Identity / location |

## Computers — key columns

| Column Name | Use |
|---|---|
| `COMPUTER_NAME`, `DNS_NAME`, `SAM_ACCOUNT_NAME` | Identity |
| `OPERATING_SYSTEM`, `VERSION`, `SERVICE_PACK` | OS inventory / EoL detection |
| `BITLOCKER_STATUS` | Disk encryption posture |
| `LAST_LOGON_TIME`, `LAST_LOGON_TIMESTAMP` | Stale machine detection |
| `COMPUTER_STATUS` | Enabled / Disabled |
| `ROLE` | Workstation / Server / DC |
| `TRUSTED_FOR_DELEGATION` | Security risk indicator |
| `OU_NAME`, `DOMAIN_NAME`, `OBJECT_GUID`, `SID_STRING` | Location / identity |

## Organizational Units — key columns

| Column Name | Use |
|---|---|
| `NAME`, `OU_NAME` | Identity |
| `MANAGER` | Owner |
| `WHEN_CREATED`, `WHEN_CHANGED` | Audit |
| `DISTINGUISHED_NAME`, `OBJECT_GUID`, `DOMAIN_NAME` | Hierarchy |
