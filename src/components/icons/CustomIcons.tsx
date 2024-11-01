import React from "react";
import { SvgProps } from "react-native-svg";
import LengthSvg from "../../assets/svg_icons/length.svg";
import SpeedSvg from "../../assets/svg_icons/speed.svg";
import PriceSvg from "../../assets/svg_icons/price.svg";
import SeizedSvg from "../../assets/svg_icons/seized.svg";

interface IconProps {
  size?: number;
  color?: string;
}

export const SizeIcon: React.FC<IconProps> = ({
  size = 24,
  color = "#000",
}) => {
  const props: SvgProps = {
    width: size,
    height: size,
    fill: color,
  };
  return React.createElement(LengthSvg, props);
};

export const SpeedometerIcon: React.FC<IconProps> = ({
  size = 24,
  color = "#000",
}) => {
  const props: SvgProps = {
    width: size,
    height: size,
    fill: color,
  };
  return React.createElement(SpeedSvg, props);
};

export const PriceIcon: React.FC<IconProps> = ({
  size = 24,
  color = "#000",
}) => {
  const props: SvgProps = {
    width: size,
    height: size,
    fill: color,
  };
  return React.createElement(PriceSvg, props);
};

export const SeizedIcon: React.FC<IconProps> = ({
  size = 24,
  color = "#000",
}) => {
  const props: SvgProps = {
    width: size,
    height: size,
    fill: color,
  };
  return React.createElement(SeizedSvg, props);
};
