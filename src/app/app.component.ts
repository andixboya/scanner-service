import {Component, OnInit} from '@angular/core';
import {ScannerService} from './service/scanner-service';
import {ExportImageInfoDto} from './model/export-image-info-dto';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'signalRAngular';

  constructor(private scannerService: ScannerService) {
  }

  ngOnInit(): void {
    this.scannerService.onNotification.subscribe((expDto: ExportImageInfoDto) => {
    });

  }
}


