// this one might not be necessary at all...
export interface TransferFieldDto {
  'fieldName'?: number;
  'value'?: string;
  'valid'?: number; // 0 disabled(undefined), 1 verified(true),2 not_verified(false).
}
