/// <reference types="react-scripts" />

declare module 'react-router-dom' {
  export function useNavigate(): (path: string) => void;
  export function Routes(props: any): JSX.Element;
  export function Route(props: any): JSX.Element;
  export function Navigate(props: any): JSX.Element;
  export function BrowserRouter(props: any): JSX.Element;
  export function Link(props: any): JSX.Element;
  export function Outlet(props: any): JSX.Element;
  export function useParams(): any;
  export function useLocation(): any;
}

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
