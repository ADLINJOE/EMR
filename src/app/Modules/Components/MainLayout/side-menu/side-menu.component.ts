import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-side-menu',
  imports: [CommonModule],
  templateUrl: './side-menu.component.html',
  styleUrl: './side-menu.component.scss'
})
export class SideMenuComponent {
  navItems = [
    {
      title: 'Home',
      icon: '🏠',
      isOpen: false,
      subItems: [
        { title: 'Sub Home 1', icon: '🔹' },
        { title: 'Sub Home 2', icon: '🔸' },
      ],
    },
    {
      title: 'Dashboard',
      icon: '📊',
      isOpen: false,
      subItems: [
        { title: 'Sub Dashboard 1', icon: '🔹' },
        { title: 'Sub Dashboard 2', icon: '🔸' },
      ],
    },
    {
      title: 'Projects',
      icon: '📂',
      isOpen: false,
      subItems: [
        { title: 'Sub Project 1', icon: '🔹' },
        { title: 'Sub Project 2', icon: '🔸' },
      ],
    },
    {
      title: 'Tasks',
      icon: '📋',
      isOpen: false,
      subItems: [
        { title: 'Sub Task 1', icon: '🔹' },
        { title: 'Sub Task 2', icon: '🔸' },
      ],
    },
    {
      title: 'Reporting',
      icon: '📈',
      isOpen: false,
      subItems: [
        { title: 'Sub Reporting 1', icon: '🔹' },
        { title: 'Sub Reporting 2', icon: '🔸' },
      ],
    },
  ];

  selectedIndex: number | null = null;  // Track the selected item index

  // Toggle submenu visibility and set active class
  toggleSubmenu(index: number): void {
    this.navItems[index].isOpen = !this.navItems[index].isOpen;
    this.selectedIndex = this.selectedIndex === index ? null : index;  // Toggle active class
  }
}
