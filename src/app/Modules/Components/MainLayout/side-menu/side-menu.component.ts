import { Component, OnInit, inject, signal } from '@angular/core';
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
  private router = inject(Router);
  private menuService = inject(SharedServiceService);

  rawMenu = signal(this.menuService.menuItems());
  menuSections = signal<any[]>([]);
  isCollapsed = signal(false); // Sidebar collapse state

  ngOnInit() {
    const grouped: Record<string, any> = {};
    for (const item of this.rawMenu()) {
      const module = item.moduleType || 'General';
      if (!grouped[module]) {
        grouped[module] = {
          title: module,
          icon: '📁',
          isOpen: false,
          subItems: [],
        };
      }

      grouped[module].subItems.push({
        title: item.componentName.replace('Component', ''),
        icon: '🔹',
        path: item.componentPath,
      });
    }

    const groupedArray = Object.values(grouped);
    const currentPath = this.router.url.split('/').pop();

    for (const section of groupedArray) {
      if (section.subItems.some((s: any) => s.path === currentPath)) {
        section.isOpen = true;
        break;
      }
    }

    this.menuSections.set(groupedArray);

    if (this.router.url === '/MainLayout') {
      this.router.navigate(['MainLayout', 'Patientinvite']);
    }
  }

  toggleMenu(section: any) {
    section.isOpen = !section.isOpen;
    this.menuSections.set([...this.menuSections()]);
  }

  navigateTo(path: string) {
    this.router.navigate(['MainLayout', path]);
  }

  toggleSidebar() {
    this.isCollapsed.update(val => !val);
  }

  isActiveRoute(path: string): boolean {
    return this.router.url.endsWith(path);
  }
}
