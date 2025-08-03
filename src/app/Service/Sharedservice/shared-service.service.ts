import { Injectable, signal } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { PatientDetails } from '../../Modules/Interface/PatientFile';



@Injectable({
  providedIn: 'root'
})
export class SharedServiceService {

  constructor(private toastrService: ToastrService) { }


  private _menuItems = signal<any[]>([]);
  readonly menuItems = this._menuItems.asReadonly();

  setMenuItems(items: any[]) {
    this._menuItems.set(items);
  }
  private _patientDetails = signal<PatientDetails | null>(null);

  // Readonly version for components
  patientDetails = this._patientDetails.asReadonly();

  setPatientDetails(details: PatientDetails) {
    this._patientDetails.set(details);
  }

  clearPatientDetails() {
    this._patientDetails.set(null);
  }
  Messages(icon: "error" | "warning" | "info" | "success", title: string, text: string, timer?: number, ExtendedTimeOut?: number) {
    if (!timer) {
      timer = 3000;
    }
    if (!ExtendedTimeOut) {
      ExtendedTimeOut = 3000;
    }
    let ToastID = null
    if (icon == 'error') {
      ToastID = this.toastrService.error(text, title, { timeOut: timer, enableHtml: true, extendedTimeOut: ExtendedTimeOut }).toastId;
    }
    else if (icon == 'warning') {
      ToastID = this.toastrService.warning(text, title, { timeOut: timer, enableHtml: true, extendedTimeOut: ExtendedTimeOut }).toastId;
    }

    else if (icon == 'info') {
      ToastID = this.toastrService.info(text, title, { timeOut: timer, enableHtml: true, extendedTimeOut: ExtendedTimeOut }).toastId;
    }
    else if (icon == 'success') {
      ToastID = this.toastrService.success(text, title, { timeOut: timer, enableHtml: true, extendedTimeOut: ExtendedTimeOut }).toastId;
    }
    return ToastID;

  }
}
