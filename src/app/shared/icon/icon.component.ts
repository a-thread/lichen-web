import { Component, input } from "@angular/core";
import { IconName } from "./icon-name";

@Component({
  selector: "app-icon",
  standalone: true,
  templateUrl: "./icon.component.html",
  styleUrl: "./icon.component.scss",
})
export class IconComponent {
  name = input.required<IconName>();
  size = input(20);
}
