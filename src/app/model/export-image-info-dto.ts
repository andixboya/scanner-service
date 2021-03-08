import {RegulaBaseInfo} from './regula-model/regula-base-info';

export interface ExportImageInfoDto {
  scannedImageAsBytes?: RegulaBaseInfo; // FileImage
  scannedImageFieldsAsBytes?: ScannedImageFieldsAsBytes; // Graphics
  scannedFieldsAsJson?: VisualOcrResultType; // ocrLexicalAnalyze
}


// related to the second type
interface ScannedImageFieldsAsBytes extends RegulaBaseInfo {
  'DocGraphicsInfo': DocGraphicsInfo;
}

interface DocGraphicsInfo {
  'nFields': number; // number of below-scanned fields.
  'pArrayFields': Array<SingleImageField>;
}

interface SingleImageField {
  'FieldType': number;
  'FieldRect': FieldRectangular;
  'FieldName': string;
  'image': Image; // most important field.
}

interface FieldRectangular {
  'bottom': number;
  'left': number;
  'right': number;
  'top': number;
}

interface Image {
  'image': string; // already converted bas64 byte string
  'format': string;
}

// the full text info fields as json and xml (xml is always persistent) (3rd obj)
interface VisualOcrResultType extends RegulaBaseInfo {
  'ListVerifiedFields': VerifiedFields;
}

interface VerifiedFields {
  Count: number;
  pFieldMaps: Array<FieldInfo>;
  pDateFormat: string;
}

interface FieldInfo {
  'FieldType': number;
  'wFieldType': number; //
  'wLCID': number;
  'Field_MRZ': string; // the field value  as string
  'Field_Visual': string;
  'Matrix': Array<number>;
}



