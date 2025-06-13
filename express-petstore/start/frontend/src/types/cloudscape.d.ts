declare module '@cloudscape-design/components' {
  import { ReactNode, FC } from 'react';

  export interface BaseProps {
    children?: ReactNode;
  }

  export interface ContainerProps extends BaseProps {
    variant?: string;
  }
  export const Container: FC<ContainerProps>;

  export interface HeaderProps extends BaseProps {
    variant?: string;
    actions?: ReactNode;
  }
  export const Header: FC<HeaderProps>;

  export interface SpaceBetweenProps extends BaseProps {
    size?: string;
    direction?: string;
  }
  export const SpaceBetween: FC<SpaceBetweenProps>;

  export interface BoxProps extends BaseProps {
    variant?: string;
    padding?: any;
    textAlign?: string;
    color?: string;
  }
  export const Box: FC<BoxProps>;

  export interface ButtonProps extends BaseProps {
    variant?: string;
    onClick?: () => void;
    loading?: boolean;
  }
  export const Button: FC<ButtonProps>;

  export interface FormProps extends BaseProps {
    actions?: ReactNode;
  }
  export const Form: FC<FormProps>;

  export interface FormFieldProps extends BaseProps {
    label?: string;
    required?: boolean;
  }
  export const FormField: FC<FormFieldProps>;

  export interface InputProps {
    value?: string;
    onChange?: (event: { detail: { value: string } }) => void;
    disabled?: boolean;
    type?: string;
    placeholder?: string;
  }
  export const Input: FC<InputProps>;

  export interface SelectProps {
    options?: Array<{label: string, value: string}>;
    selectedOption?: {label: string, value: string};
    onChange?: (event: { detail: { selectedOption: {label: string, value: string} } }) => void;
    disabled?: boolean;
  }
  export const Select: FC<SelectProps>;

  export interface AlertProps extends BaseProps {
    type?: string;
    dismissible?: boolean;
    onDismiss?: () => void;
  }
  export const Alert: FC<AlertProps>;

  export interface ColumnLayoutProps extends BaseProps {
    columns?: number;
    variant?: string;
  }
  export const ColumnLayout: FC<ColumnLayoutProps>;

  export interface CardsProps {
    cardDefinition?: any;
    cardsPerRow?: Array<{cards?: number, minWidth?: number}>;
    items?: any[];
    loadingText?: string;
    empty?: ReactNode;
  }
  export const Cards: FC<CardsProps>;

  export interface TextContentProps extends BaseProps {}
  export const TextContent: FC<TextContentProps>;

  export interface AppLayoutProps extends BaseProps {
    navigation?: ReactNode;
    toolsHide?: boolean;
    contentType?: string;
    tools?: ReactNode;
  }
  export const AppLayout: FC<AppLayoutProps>;

  export interface SideNavigationProps extends BaseProps {
    items?: Array<{type?: string, text?: string, href?: string, items?: any[]}>;
    header?: {text?: string, href?: string};
    activeHref?: string;
  }
  export const SideNavigation: FC<SideNavigationProps>;
}
