/**
 * Universal routing utilities for cross-platform navigation
 * Works with both Next.js (web) and React Router (desktop)
 */

export { Link } from './Link';
export { useNavigation } from './useNavigation';
export { isNextJS, isElectron, getRoutingMode } from './platform';
