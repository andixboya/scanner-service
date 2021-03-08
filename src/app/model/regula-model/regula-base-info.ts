export interface RegulaBaseInfo {

  'result_type': number;
  'light': number;
  'buf_length': number;
  'list_idx': number;
  'page_idx': number;
  'XML_buffer': string;
  'HostInfo': HostInfo;
}

// from here we`ll extract info and logic, depending on the device and who sends it.
interface HostInfo {
  'DateTime': string; // could be date too?
  'TransactionID': string;
  'ComputerName': string;
  'UserName': string;
  'SDKVersion': string;
  'FileVersion': string;
  'DeviceType': string;
  'DeviceNumber': string; // really important
  'DeviceLabelNumber': string; // '7DF335BA8667' , really important. You can have a map deviceId to idx connected to reader!
}
