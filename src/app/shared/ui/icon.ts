import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import type { IconNode } from "lucide";

/**
 * Renders a Lucide icon (from the framework-agnostic `lucide` package) as inline SVG, with the
 * same defaults as lucide-react: 24px, 2px stroke, `currentColor`, hidden from assistive tech.
 *
 * Usage: `<svg [appIcon]="icons.Search" [size]="18"></svg>`
 */
@Component({
  selector: "svg[appIcon]",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "aria-hidden": "true",
    "[attr.width]": "size()",
    "[attr.height]": "size()",
    "[attr.fill]": "fill()",
    "[attr.stroke-width]": "strokeWidth()",
  },
  template: `
    @for (node of appIcon(); track $index) {
      @let a = node[1];
      @switch (node[0]) {
        @case ("path") {
          <svg:path [attr.d]="a['d']" />
        }
        @case ("circle") {
          <svg:circle [attr.cx]="a['cx']" [attr.cy]="a['cy']" [attr.r]="a['r']" />
        }
        @case ("rect") {
          <svg:rect [attr.x]="a['x']" [attr.y]="a['y']" [attr.width]="a['width']" [attr.height]="a['height']" [attr.rx]="a['rx']" [attr.ry]="a['ry']" />
        }
        @case ("line") {
          <svg:line [attr.x1]="a['x1']" [attr.y1]="a['y1']" [attr.x2]="a['x2']" [attr.y2]="a['y2']" />
        }
        @case ("polyline") {
          <svg:polyline [attr.points]="a['points']" />
        }
        @case ("polygon") {
          <svg:polygon [attr.points]="a['points']" />
        }
        @case ("ellipse") {
          <svg:ellipse [attr.cx]="a['cx']" [attr.cy]="a['cy']" [attr.rx]="a['rx']" [attr.ry]="a['ry']" />
        }
      }
    }
  `,
})
export class Icon {
  readonly appIcon = input.required<IconNode>();
  readonly size = input<number | string>(24);
  readonly strokeWidth = input<number | string>(2);
  readonly fill = input("none");
}
