import type { ColorValue } from 'react-native';
import HomeStroke from '@assets/icons/home-stroke.svg';
import HomeFilled from '@assets/icons/home-filled.svg';
import BriefcaseStroke from '@assets/icons/briefcase-stroke.svg';
import BriefcaseFilled from '@assets/icons/briefcase-filled.svg';
import MessageStroke from '@assets/icons/message-stroke.svg';
import MessageFilled from '@assets/icons/message-filled.svg';
import ProfileStroke from '@assets/icons/profile-stroke.svg';
import ProfileFilled from '@assets/icons/profile-filled.svg';

export type TabName = 'dashboard' | 'offers' | 'messages' | 'profile';

const icons = {
  dashboard: { stroke: HomeStroke, filled: HomeFilled },
  offers: { stroke: BriefcaseStroke, filled: BriefcaseFilled },
  messages: { stroke: MessageStroke, filled: MessageFilled },
  profile: { stroke: ProfileStroke, filled: ProfileFilled },
} as const;

interface TabIconProps {
  name: TabName;
  focused: boolean;
  color: ColorValue;
  size?: number;
}

// Les SVG utilisent `currentColor` → la prop `color` de react-native-svg les teinte.
export const TabIcon = ({ name, focused, color, size = 24 }: TabIconProps) => {
  const Svg = focused ? icons[name].filled : icons[name].stroke;
  return <Svg width={size} height={size} color={color} />;
};
