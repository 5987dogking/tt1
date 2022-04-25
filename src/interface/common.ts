export interface DBbase {
  created_at?: number;
  updated_at?: number;
  deleted_at?: number;
}

export interface ENV {
  line_pay: ENVLinePay;
  line: ENVLine;
  gmb_api: ENVGMB;
  system: ENVSytem;
  client_id: string;
  client_secret: string;
  REDIRECT_URL: string;
  CHANNEL_ACCESS_TOKEN: string;
  CHANNEL_SECRET: string;
  ads: ADS
}

export interface ADS {
  // #Adwords Api set
  // #ADWORDS_MANAGED_CUSTOMER_GMAIL: MCC administrative owner-> "aonnie@flashaim.com"
  adwords_date_time_zone: string;
  adwords_currencycode: string;
  adwords_managed_customer_gmail: string
  adwords_managed_customer_id: string;
  adwords_descriptive_name: string;
  adwords_associate_feedcustomer_schedule: string;
  adwords_developer_token: string;
  adwords_test_customer_id: string;
  adwords_test_user_id: string;
  adwords_developer＿token: string;
  // # myBusiness Admin account pw bot783688`
  // #MYBUSINESS_ADMIN=mapbotagent@gmail.com
  mybusiness_admin: string;
}

export interface ENVLine {
  channel_secret: string
  channel_access_token: string
}

export interface ENVLinePay {
  channel_id: string
  channel_secret: string
}

export interface ENVGMB {
  client_id: string;
  client_secret: string;
}

export interface ENVSytem {
  sendgrid_api_key: string;
  project_id: 'booking-test-ed2be' | 'booking-8d1fc' | 'booking-s1';
}
