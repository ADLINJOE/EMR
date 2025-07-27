import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedServiceService } from '../../../../Service/Sharedservice/shared-service.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-side-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './side-menu.component.html',
  styleUrl: './side-menu.component.scss',
})
export class SideMenuComponent implements OnInit {
  constructor(private router: Router) {}
  private menuService = inject(SharedServiceService);

  rawMenu = signal(this.menuService.menuItems());

  // Store actual menu structure in signal so it can be manipulated
  menuSections = signal<any[]>([]);

  ngOnInit() {
    // Build grouped menu
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

    // Get current route (like 'Patientinvite')
    const currentPath = this.router.url.split('/').pop();

    // Expand the section that includes current path
    for (const section of groupedArray) {
      if (section.subItems.some((s: any) => s.path === currentPath)) {
        section.isOpen = true;
        break;
      }
    }

    this.menuSections.set(groupedArray);

    // Navigate to default if only at /MainLayout
    if (this.router.url === '/MainLayout') {
      this.router.navigate(['MainLayout', 'Patientinvite']);
    }
  }

  toggleMenu(section: any) {
    section.isOpen = !section.isOpen;
    this.menuSections.set([...this.menuSections()]); // trigger signal update
  }

  navigateTo(path: string) {
    this.router.navigate(['MainLayout', path]);
  }
}
