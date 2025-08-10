import { Component, EventEmitter, HostListener, Input, OnInit, Output, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SharedServiceService } from '../../../../Service/Sharedservice/shared-service.service';

@Component({
  selector: 'app-side-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './side-menu.component.html',
  styleUrl: './side-menu.component.scss',
})
export class SideMenuComponent implements OnInit {
  menuItems = signal<any[]>([]);
  isMobile = window.innerWidth <= 768;

  @Input() collapsed: boolean = true;
  @Output() collapsedChange = new EventEmitter<boolean>();
  @Output() closeSidebar = new EventEmitter<void>();

  private sharedService = inject(SharedServiceService);
  private router = inject(Router);
get showBackdrop() {
  return this.isMobile && !this.collapsed;
}

 ngOnInit() {
  const items = this.sharedService.menuItems().map(item => ({
    title: item.componentName.replace('Component', ''),
    icon: item.icon || 'medical_services',
    path: item.componentPath,
    startpage: item.startPage,
  }));
  this.menuItems.set(items);

  // ✅ Select the first menu item initially if exists
  if (items.length > 0) {
    const firstPath = items[0].path;
    if (!this.router.url.includes(firstPath)) {
      this.router.navigate(['MainLayout', firstPath]);
    }
  }
}


  toggleSidebar() {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }

  isActiveRoute(path: string): boolean {
    const currentPath = this.router.url.split('/').pop();
    return currentPath === path;
  }

  navigateTo(path: string) {
    this.router.navigate(['MainLayout', path]);
    if (this.isMobile) {
      this.collapsed = true;
      this.collapsedChange.emit(this.collapsed);
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.isMobile = event.target.innerWidth <= 768;
    if (!this.isMobile) {
      this.collapsed = false;
      this.collapsedChange.emit(this.collapsed);
    } else {
      this.collapsed = true;
      this.collapsedChange.emit(this.collapsed);
    }
  }

  // Rename this method to avoid conflict with @Output() closeSidebar
  closeSidebarClick() {
    if (this.isMobile) {
      this.collapsed = true;
      this.collapsedChange.emit(this.collapsed);
      this.closeSidebar.emit();
    }
  }
}
