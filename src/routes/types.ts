// src/routes/types.ts
import { ComponentType, LazyExoticComponent, ReactNode } from "react";

export interface RouteConfig {
  path: string;
  element: LazyExoticComponent<ComponentType<any>> | ComponentType<any>;
  index?: boolean;
  protected?: boolean;
  children?: RouteConfig[];
}

export interface RouteGroup {
  basePath?: string;
  routes: RouteConfig[];
  wrapper?: ComponentType<{ children: ReactNode }>;
}
