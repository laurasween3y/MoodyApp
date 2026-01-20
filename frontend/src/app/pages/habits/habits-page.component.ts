import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-habits-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './habits-page.component.html',
  styleUrl: './habits-page.component.scss'
})
export class HabitsPageComponent {}
