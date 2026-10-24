import { Component, computed, EventEmitter, Output } from '@angular/core';
import { MatIconModule } from "@angular/material/icon";
import { SharedServiceService } from '../../../../Service/Sharedservice/shared-service.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header-main',
  imports: [MatIconModule],
  templateUrl: './header-main.component.html',
  styleUrl: './header-main.component.scss'
})
export class HeaderMainComponent {
  @Output() toggleSidebar = new EventEmitter<void>();
  UserSetGlobal: any;
  constructor( private sharedService: SharedServiceService, private router: Router
    ) { 



        this.UserSetGlobal = this.userinfo()
    }
  userinfo = computed(() => this.sharedService.userInfo())

 logout() {
    // optional: clear session or token
    sessionStorage.clear();
    localStorage.clear();

    // navigate to login page
    this.router.navigate(['/login']);
  }
}
