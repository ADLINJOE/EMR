import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeaderMainComponent } from '../header-main/header-main.component';
import { FooterMainComponent } from '../footer-main/footer-main.component';
import { SideMenuComponent } from '../side-menu/side-menu.component';


@Component({
  selector: 'app-layout',
  imports: [HeaderMainComponent, FooterMainComponent, SideMenuComponent, RouterModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {

}
