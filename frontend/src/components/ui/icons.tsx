'use client'

import { forwardRef } from 'react'
import type { ElementType } from 'react'
import Box from '@mui/material/Box'
import type { SvgIconProps } from '@mui/material/SvgIcon'
import type { SxProps, Theme } from '@mui/material/styles'
import type { IconWeight } from '@solar-icons/react'
import {
  AddCircle,
  AltArrowDown,
  AltArrowLeft,
  AltArrowRight,
  AltArrowUp,
  BellBing,
  BillList,
  BoxMinimalistic,
  BranchingPathsDown,
  Buildings2,
  CalculatorMinimalistic,
  CardTransfer,
  CheckCircle,
  CheckRead,
  CloseCircle,
  Delivery,
  Diskette,
  Eye,
  EyeClosed,
  FolderWithFiles,
  Gallery,
  Global,
  GraphNewUp,
  HamburgerMenu,
  History,
  Letter,
  LockKeyhole,
  MenuDots,
  MinimalisticMagnifier,
  MoneyBag,
  MoonStars,
  PaletteRound,
  Pen2,
  Reorder2,
  Ruler,
  Sale,
  SaleSquare,
  SettingsMinimalistic,
  SidebarMinimalistic,
  Sun2,
  TagPrice,
  Text,
  TrashBinMinimalistic,
  Tuning,
  UploadMinimalistic,
  UserCircle,
  UserId,
  UsersGroupRounded,
  WalletMoney,
  Widget5,
  Monitor,
} from '@solar-icons/react/ssr'

type AppIconColor = NonNullable<SvgIconProps['color']>
type AppIconFontSize = NonNullable<SvgIconProps['fontSize']>

interface AppIconProps extends Omit<SvgIconProps, 'component' | 'children' | 'inheritViewBox'> {
  weight?: IconWeight
}

const FONT_SIZE_MAP: Record<AppIconFontSize, string> = {
  inherit: '1em',
  small: '20px',
  medium: '24px',
  large: '35px',
}

const COLOR_MAP: Partial<Record<AppIconColor, string>> = {
  action: 'action.active',
  disabled: 'action.disabled',
  error: 'error.main',
  info: 'info.main',
  primary: 'primary.main',
  secondary: 'secondary.main',
  success: 'success.main',
  warning: 'warning.main',
}

function normalizeSx(sx?: SxProps<Theme>) {
  if (!sx) return []
  return Array.isArray(sx) ? sx : [sx]
}

function createIcon(icon: ElementType) {
  const Component = forwardRef<HTMLSpanElement, AppIconProps>(function SolarMuiIcon(
    {
      className,
      color = 'inherit',
      fontSize = 'medium',
      htmlColor,
      sx,
      titleAccess,
      weight = 'BoldDuotone',
      ...rest
    },
    ref,
  ) {
    const resolvedColor = htmlColor ?? 'currentColor'

    return (
      <Box
        ref={ref}
        component="span"
        className={className}
        role={titleAccess ? 'img' : undefined}
        aria-label={titleAccess}
        sx={[
          {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '1em',
            height: '1em',
            fontSize: FONT_SIZE_MAP[fontSize],
            lineHeight: 0,
            flexShrink: 0,
            color: color === 'inherit' ? 'inherit' : COLOR_MAP[color] ?? color,
          },
          ...normalizeSx(sx),
        ]}
      >
        <Box
          component={icon}
          size="100%"
          color={resolvedColor}
          weight={weight}
          alt={titleAccess}
          aria-hidden={!titleAccess}
          {...rest}
        />
      </Box>
    )
  })

  Component.displayName = 'SolarMuiIcon'
  return Component
}

export const AccountBalanceOutlined = createIcon(CardTransfer)
export const AccountBalanceWalletOutlined = createIcon(WalletMoney)
export const AccountTreeOutlined = createIcon(BranchingPathsDown)
export const Add = createIcon(AddCircle)
export const ArrowBack = createIcon(AltArrowLeft)
export const Brightness4 = createIcon(MoonStars)
export const Brightness7 = createIcon(Sun2)
export const CalculateOutlined = createIcon(CalculatorMinimalistic)
export const CategoryOutlined = createIcon(FolderWithFiles)
export const CheckCircleOutlined = createIcon(CheckCircle)
export const ChevronLeft = createIcon(AltArrowLeft)
export const ChevronRight = createIcon(AltArrowRight)
export const Close = createIcon(CloseCircle)
export const CompareArrowsOutlined = createIcon(Reorder2)
export const DarkModeOutlined = createIcon(MoonStars)
export const DashboardOutlined = createIcon(Widget5)
export const DeleteOutlined = createIcon(TrashBinMinimalistic)
export const DoneAll = createIcon(CheckRead)
export const EditOutlined = createIcon(Pen2)
export const ExpandLess = createIcon(AltArrowUp)
export const ExpandMore = createIcon(AltArrowDown)
export const FactCheckOutlined = createIcon(CheckRead)
export const LanguageOutlined = createIcon(Global)
export const GroupsOutlined = createIcon(UsersGroupRounded)
export const HistoryOutlined = createIcon(History)
export const ImageOutlined = createIcon(Gallery)
export const Inventory2Outlined = createIcon(BoxMinimalistic)
export const LightModeOutlined = createIcon(Sun2)
export const LocalAtmOutlined = createIcon(WalletMoney)
export const LocalOfferOutlined = createIcon(TagPrice)
export const LocalShippingOutlined = createIcon(Delivery)
export const LockOutlined = createIcon(LockKeyhole)
export const Mail = createIcon(Letter)
export const Menu = createIcon(HamburgerMenu)
export const MoreVert = createIcon(MenuDots)
export const NavigateNext = createIcon(AltArrowRight)
export const Notifications = createIcon(BellBing)
export const PaletteOutlined = createIcon(PaletteRound)
export const PaymentsOutlined = createIcon(MoneyBag)
export const PeopleAltOutlined = createIcon(UserId)
export const PeopleOutlined = createIcon(UserCircle)
export const PercentOutlined = createIcon(Sale)
export const PointOfSaleOutlined = createIcon(SaleSquare)
export const ReceiptLongOutlined = createIcon(BillList)
export const SaveOutlined = createIcon(Diskette)
export const Search = createIcon(MinimalisticMagnifier)
export const SettingsOutlined = createIcon(SettingsMinimalistic)
export const StraightenOutlined = createIcon(Ruler)
export const TextFieldsOutlined = createIcon(Text)
export const TrendingUpOutlined = createIcon(GraphNewUp)
export const TuneOutlined = createIcon(Tuning)
export const UploadOutlined = createIcon(UploadMinimalistic)
export const ViewSidebarOutlined = createIcon(SidebarMinimalistic)
export const Visibility = createIcon(Eye)
export const VisibilityOff = createIcon(EyeClosed)
export const VisibilityOutlined = createIcon(Eye)
export const WarehouseOutlined = createIcon(Buildings2)
export const MonitorOutlined = createIcon(Monitor)
