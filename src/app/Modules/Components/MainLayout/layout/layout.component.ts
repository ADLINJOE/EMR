import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeaderMainComponent } from '../header-main/header-main.component';
import { FooterMainComponent } from '../footer-main/footer-main.component';
import { SideMenuComponent } from '../side-menu/side-menu.component';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-layout',
  imports: [HeaderMainComponent, FooterMainComponent, SideMenuComponent, RouterModule,CommonModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
 isSidebarCollapsed = signal(true); // start collapsed on mobile, open on desktop

  onToggleSidebar() {
    this.isSidebarCollapsed.update(value => !value);
  }

  onCloseSidebar() {
    this.isSidebarCollapsed.set(true);
  }
}
