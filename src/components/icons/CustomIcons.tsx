import React from "react";
import { SvgProps } from "react-native-svg";
import LengthSvg from "../../assets/svg_icons/length.svg";
import SpeedSvg from "../../assets/svg_icons/speed.svg";
import PriceSvg from "../../assets/svg_icons/price.svg";
import SeizedSvg from "../../assets/svg_icons/seized.svg";

export interface IconProps {
  size?: number;
  color?: string;
}

// Create a type for our icon components
type IconComponent = React.FC<IconProps>;

const createIconComponent = (
  SvgComponent: React.FC<SvgProps>,
): IconComponent => {
  return ({ size = 24, color = "#000" }) => {
    const props: SvgProps = {
      width: size,
      height: size,
      fill: color,
    };
    return React.createElement(SvgComponent, props);
  };
};

export const SizeIcon = createIconComponent(LengthSvg);
export const SpeedometerIcon = createIconComponent(SpeedSvg);
export const PriceIcon = createIconComponent(PriceSvg);
export const SeizedIcon = createIconComponent(SeizedSvg);

// Add display names for better debugging
SizeIcon.displayName = "SizeIcon";
SpeedometerIcon.displayName = "SpeedometerIcon";
PriceIcon.displayName = "PriceIcon";
SeizedIcon.displayName = "SeizedIcon";
