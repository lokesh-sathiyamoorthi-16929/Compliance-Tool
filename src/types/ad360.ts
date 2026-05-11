export interface Ad360ListMeta {
  start_index: number;
  limit: number;
  total_no_of_objects: number;
}

export interface Ad360ListResponse<T> {
  data: T[];
  meta: Ad360ListMeta;
}

export interface Ad360Error {
  error: {
    code: string;
    title: string;
    detail: string;
  };
}

export interface Ad360User {
  ACCOUNT_STATUS?: string;
  ACCOUNT_EXPIRY_DATE?: string;
  LAST_LOGON_TIME?: string;
  DAYS_SINCE_LAST_LOGON?: string | number;
  LOCK_OUT_TIME?: string;
  BAD_PASSWORD_COUNT?: string | number;
  PWD_NEV_EXP_FLAG?: string | boolean;
  PASSWORD_EXPIRY_DATE?: string;
  DAYS_TO_EXPIRE_PASSWORD?: string | number;
  SMART_CARD_FOR_INTERACTIVE_LOGIN?: string | boolean;
  MEMBER_OF?: string | string[];
  SAM_ACCOUNT_NAME?: string;
  LOGON_NAME?: string;
  DISPLAY_NAME?: string;
  EMAIL_ADDRESS?: string;
  EMPLOYEE_ID?: string;
  DEPARTMENT?: string;
  TITLE?: string;
  MANAGER?: string;
  OU_NAME?: string;
  DOMAIN_NAME?: string;
  OBJECT_GUID?: string;
  SID_STRING?: string;
  [key: string]: unknown;
}

export interface Ad360Group {
  GROUP_NAME?: string;
  SAM_ACCOUNT_NAME?: string;
  GROUP_TYPE?: string;
  GROUP_SCOPE?: string;
  MEMBER_OF?: string | string[];
  MANAGER?: string;
  DISTINGUISHED_NAME?: string;
  OBJECT_GUID?: string;
  SID_STRING?: string;
  OU_NAME?: string;
  DOMAIN_NAME?: string;
  [key: string]: unknown;
}

export interface Ad360Computer {
  COMPUTER_NAME?: string;
  DNS_NAME?: string;
  SAM_ACCOUNT_NAME?: string;
  OPERATING_SYSTEM?: string;
  VERSION?: string;
  SERVICE_PACK?: string;
  BITLOCKER_STATUS?: string;
  LAST_LOGON_TIME?: string;
  LAST_LOGON_TIMESTAMP?: string;
  COMPUTER_STATUS?: string;
  ROLE?: string;
  TRUSTED_FOR_DELEGATION?: string | boolean;
  OU_NAME?: string;
  DOMAIN_NAME?: string;
  OBJECT_GUID?: string;
  SID_STRING?: string;
  [key: string]: unknown;
}

export interface Ad360OU {
  NAME?: string;
  OU_NAME?: string;
  MANAGER?: string;
  WHEN_CREATED?: string;
  WHEN_CHANGED?: string;
  DISTINGUISHED_NAME?: string;
  OBJECT_GUID?: string;
  DOMAIN_NAME?: string;
  [key: string]: unknown;
}

export interface Ad360SummaryResponse {
  users: {
    total: number;
    disabled: number;
    lockedOut: number;
    neverExpiringPassword?: number;
  };
  privilegedUsers: {
    count: number;
    samNames: string[];
    smartCardPct?: number;
  };
  staleAccounts: {
    count: number;
    samNames: string[];
  };
  computers: {
    total: number;
    bitlockerEnabledPct: number;
    osDistribution?: Record<string, number>;
  };
}
