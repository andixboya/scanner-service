import {Injectable} from '@angular/core';
import Connection = SignalR.Hub.Connection;
import Proxy = SignalR.Hub.Proxy;
import {Constants} from '../constant/constants';
import {HttpClient} from '@angular/common/http';
import {concatMap, filter, map} from 'rxjs/operators';
import {Observable, Subject, zip} from 'rxjs';
import {environment} from '../../environments/environment'; // this could be problematic...
import {ExportImageInfoDto} from '../model/export-image-info-dto';
import {RegulaBaseInfo} from '../model/regula-model/regula-base-info';

// description of the communication.
// scannerService..., who will have subject who will recieve observables and all you have to do is... subscribe to him, i think
// and you need to initialize the observable oand then from the service you`ll just subscribe for it ,
// but you need to call initializeListenersToPrinter, actually... i `ll just have a subject here and it will be going through him!
// just like... the other subject/observable stuff. That is how you`ll extract it , good times, good thing I understood that, so that
// I can communicate anyway i want!

@Injectable({
  providedIn: 'root'
})
export class ScannerService {

  // the below is necessary for extraction of the object which is scanned (as a whole)
  private readonly RPRM_RESULT_TYPE_FILE_IMAGE = '2';
  // the below is necessary for extraction of single pictures of the scanned object like passport/signature
  private readonly RPRM_RESULT_TYPE_GRAPHICS_DISPLAY_FIELDS = '6';
  // the below result type is necessary as it gives us xml, which we format into json with format param.
  private readonly RPRM_RESULT_TYPE_XML_LEXICAL_ANALIZE = '15';
  // 0x00080000 ofrFormat_JSON with this we explicitly set the format return type. Json in this case;
  private readonly A_FORMAT = 524288;

  private readonly onNotification$: Observable<any>;


  constructor(private client: HttpClient) {
    this.onNotification$ = this.notificationSubject.asObservable();
    this.initializeListenersToPrinter();
  }

  public notificationSubject: Subject<ExportImageInfoDto> = new Subject<ExportImageInfoDto>();

  // with jQuery:
  private initializeListenersToPrinter(): void {
    // here you define the url
    const connection: Connection = $.hubConnection(environment.REGULA_WEB_SERVICE_HOST);
    const hubProxy: Proxy = connection.createHubProxy(environment.REGULA_WEB_SERVICE_HUB_NAME);
    // hubProxy.on(Constants.ON_RESULTS_READY, this.onResultReady); // this phase is a bit useless.


    hubProxy.on(Constants.ON_PROCESSING_FINISHED, () => this.onProcessingFinished());
    connection.start().done(_ => {
    }, _ => {
    });
    // you don`t need the this... Only the initialization of the connection is enough.
    // hubProxy.init(connectionTwo, 'EventsHub');
  }

  get onNotification(): Observable<any> {
    return this.onNotification$;
  }

  private onProcessingFinished(): void {
    const getActiveDeviceIdxUrl = `${environment.REGULA_WEB_SERVICE_HOST}/settings/getpropertyvalue?propertyname=activedeviceidx`;
    this.client.get(getActiveDeviceIdxUrl)
      .pipe(
        filter(x => x !== null && x !== undefined),
        concatMap((deviceId: string) => this.getProcessedImageAsObs(deviceId))
      ).subscribe((result: ExportImageInfoDto) => {
      // whoever needs to be notified will be
      this.notificationSubject.next(result);
    });
    // this.imageScannerService.processNewImageWithOnNotificationOptical(aType, null);
  }

  private getProcessedImageAsObs(deviceId: string): Observable<any> {
    const getImageResultAsBytesUrl = `${environment.REGULA_WEB_SERVICE_HOST}/methods/CheckReaderResultXml?AType=
          ${this.RPRM_RESULT_TYPE_FILE_IMAGE}&AIdx=${deviceId}&AOutput=${this.A_FORMAT}`;
    const getSingleVisualObjectsAsBytesUrl = `${environment.REGULA_WEB_SERVICE_HOST}/methods/CheckReaderResultXml?AType=
          ${this.RPRM_RESULT_TYPE_GRAPHICS_DISPLAY_FIELDS}&AIdx=${deviceId}&AOutput=${this.A_FORMAT}`;
    const getProcessedResultAsJsonUrl = `${environment.REGULA_WEB_SERVICE_HOST}/methods/CheckReaderResultXml?AType=
          ${this.RPRM_RESULT_TYPE_XML_LEXICAL_ANALIZE}&AIdx=${deviceId}&AOutput=${this.A_FORMAT}`;


    const processedImageResultsAsObs = zip(
      this.client.get<string>(getImageResultAsBytesUrl),
      this.client.get<string>(getSingleVisualObjectsAsBytesUrl),
      this.client.get<string>(getProcessedResultAsJsonUrl),
    ).pipe(
      map(res => this.transformIntoDto(res))
    );
    return processedImageResultsAsObs;
  }

  // genius!
  private transformIntoDto(res: Array<string>): ExportImageInfoDto {
    const transferDto: ExportImageInfoDto = {
      scannedImageAsBytes: res[0] ? JSON.parse(res[0]) : undefined,
      scannedImageFieldsAsBytes: res[1] ? JSON.parse(res[1]) : undefined,
      scannedFieldsAsJson: res[2] ? JSON.parse(res[2]) : undefined,
    };
    return transferDto;
  }
}


// probably won`t be necessary because this service should return raw data, instead of it being transformed

// private generateMap(resAsString: string): Map<string, TransferDto> {
//   const result: VisualOcrResultType = JSON.parse(resAsString);
//   const mappedObject: VisualFieldMappedObject = {};
//   const fieldMap = new Map<string, TransferDto>(); // i`ll get map.. i guess.
//   for (const field of result.ListVerifiedFields.pFieldMaps) {
//     const fieldName = Constants.EVisualFieldTypeMap[field.wFieldType]; // fieldType as enum, in case its empty it will be omitted
//     // i can put allowed fields and append them ? or... just stack them in some object and then access them?
//     const wlcId = field.wLCID; // in case it is 1026 (which is for bg-bg , it must be appended to the current value)
//     const fieldValue = field.Field_MRZ;
//     const visualFieldValue = field.Field_Visual;
//
//     if (fieldName === undefined) {
//       continue;
//     }
//
//     const current: TransferDto = {};
//     current.valid = field.Matrix[0];
//     current.fieldName = fieldName;
//     // if both are here or only fieldValue is present fieldValue takes precedence.
//     // terrible code. but this should be enough...
//     if ((visualFieldValue !== undefined && fieldValue !== undefined) || fieldValue !== undefined) {
//       if (fieldMap.get(fieldName) !== undefined && fieldMap.get(fieldName).value !== '') {
//         if (Number(wlcId) === 1026) {
//           current.value = fieldValue;
//           fieldMap.set(fieldName, current);
//         }
//         // weird... 1026 is for bg... but 0-s are translated into bg as well!? or maybe the default
//         // here we just change the value
//       } else {
//         current.value = fieldValue;
//         fieldMap.set(fieldName, current);
//       }
//     } else if (visualFieldValue !== undefined) { // otherwise it checks for visualField`s presence
//       if (fieldMap.get(fieldName) !== undefined && fieldMap.get(fieldName).value !== '') {
//         // only if its bg , should it be overwritten!
//         if (Number(wlcId) === 1026) {
//           current.value = visualFieldValue;
//           fieldMap.set(fieldName, current);
//         }
//
//       } else {
//         current.value = visualFieldValue;
//         fieldMap.set(fieldName, current);
//       }
//     }
//
//   }
//
//   return fieldMap;
// }


//  below are events from websocket, which are not necessary atm.

// private onResultReady = (aType: number) => {
//   console.log('From result ready:' + aType);
//   // the type is different , not what you expect it would be! (its  RPRM_RESULT_TYPE not the type of the field!)
// };

// private signupForOnImageReady(hubProxy: Proxy): void {
//   hubProxy.on(Constants.ON_IMAGE_READY,
//     (aLight: number, aPageIndex: number) => this.imageScannerService.processNewImageWithOnNotificationOptical(aLight, aPageIndex));
// }

// private onOpticalCondition = (aCode: number, aValue: number) => {
//   if (aCode === 2) { // code 2 is for a ready document.
//     console.log('From onOpticalCondtition:' + aCode);
//     // this.imageScannerService.processNewImageWithOnNotificationOptical(aCode, aValue);
//   }
// };


// for .net.core implementation
// public data: any[] = [];
// private hubConnection: signalR.HubConnection;

// withiout jQuery + NET.CORE signalR (the below methods)
// public initializeListenersWithNetCoreSignalR(): void {
//   // [imp/]   this probably works too but with .net core, not .net mvc
//   this.startConnection();
//   this.addImageCreationListener();
// }
//
// private startConnection = () => {
//   const url: string = 'http://localhost:/Regula.SDK.Api/signalr/';
//   // well fuck, this thing supports only .core...  and on the other side its... .NET... (the old one <2) sad.
//   // guess i`ll go with jquery then...
//
//
//   this.hubConnection = new signalR.HubConnectionBuilder()
//     .withUrl(url)
//     .build();
//   this.hubConnection
//     .start()
//     .then(() => {
//       console.log('Connection started')
//     })
//     .catch(err => {
//
//       console.log('Error while starting connection: ' + err)
//     })
// }
// private addImageCreationListener = () => {
//   this.hubConnection.on('OnNotificationOptical', (data) => {
//     this.data = data;
//     console.log(data);
//   });
// }
