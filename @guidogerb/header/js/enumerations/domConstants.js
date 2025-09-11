/**
 * @param {string | string[]} domConstants - the class or classes to which to prefix a period, multiples will be combined as a single selector
 * ie: `.class1.class2` instead of `.class1 .class2`
 * @returns {string} the combined classes
 */
export function getCssClassSelector(domConstants) {
  return `.${(Array.isArray(domConstants) ? domConstants : [domConstants]).join('.')}`
}

/**
 * An enum for CSS classes used in the ggp.guidogerbpublishing.com header
 * @enum {string}
 */
export const domConstants = {
  // Global Information
  GGP_UI_SYSTEM: 'ui-system',
  HEADER: 'header',
  FOOTER: 'footer',

  // HTML elements
  ICON_BUTTON: 'icon-button',

  // IDs
  CSS_HEADER_MEDIA_TAG_ID: 'cssHeaderMediaTag',

  // Modifiers
  IS_CLOSED: 'is-closed',
  IS_OPEN: 'is-open',
  VISUALLY_HIDDEN: 'visually-hidden',

  // Replacement Placeholders
  MEDIA_SIZE__MOBILE__PLACEHOLDER: 'media-size__mobile__PLACEHOLDER',
  MEDIA_SIZE__TABLET_LANDSCAPE__PLACEHOLDER: 'media-size__tablet-landscape__PLACEHOLDER',
  MEDIA_SIZE__TABLET_PORTRAIT__PLACEHOLDER: 'media-size__tablet-portrait__PLACEHOLDER',

  // Header Components
  ACTION_ITEM: 'header-action-item',
  ACTION_ITEM__ICON_BUTTON: 'header-action-item__icon-button',
  ACTION_ITEM__ICON_BUTTON_TITLE: 'header-action-item__icon-button--has-title',
  ACTION_ITEM__TITLE: 'header-action-item__title',
  ACTION_ITEMS__WRAPPER: 'action-items-wrapper',

  BADGE__LABEL: 'badge__label',
  BADGE__VALUE: 'badge__value',
  BADGE_WRAPPER: 'badge__wrapper',
  BADGE_WRAPPER__SMALL: 'badge__wrapper--small',
  BADGE_WRAPPER__ACTION_ITEM: 'badge__wrapper--action-item',

  CITIZEN_EXPERIENCE: 'citizen-experience-wrapper',
  CITIZEN_EXPERIENCE_MOBILE: 'citizen-experience-wrapper--mobile',

  FOOTER_COPYRIGHT_YEAR: 'footer__copyright-year',
  FOOTER_HORIZONTAL_DIVIDER: 'footer__horizontal-divider',
  FOOTER_LINK_PRIVACY_ID: 'footer-privacy-link',
  FOOTER_LINK_TERMS_ID: 'footer-terms-link',
  FOOTER_LINKS: 'footer__links',

  LOGO: 'logo-wrapper',
  LOGO_OFFICIAL_CLOSE_BUTTON: 'official-website-popup__close-button',
  LOGO_OFFICIAL_WRAPPER: 'official-website-popup__wrapper',
  LOGO_SVG: 'logo-svg',
  LOGO_VERT_LINE: 'logo-vert-line',

  MAIN_MENU: 'main-menu__wrapper',
  MAIN_MENU__HAMBURGER: 'main-menu__hamburger',
  MAIN_MENU__HAMBURGER_ID: 'main-menu__hamburger',
  MAIN_MENU__HAMBURGER_ICON_ID: 'main-menu__hamburger-icon',
  MAIN_MENU__MENU_TOP: 'main-menu__menu-top',
  MAIN_MENU__NAV: 'main-menu__nav',
  MAIN_MENU__OUTER: 'main-menu__outer',
  MAIN_MENU__REMOVED: 'main-menu-is-removed',
  MAIN_MENU__SEARCH: 'main-menu__search',
  MAIN_MENU__TITLE: 'main-menu__title',

  MENU_ITEM: 'menu-item',
  MENU_ITEM__ARROW: 'menu-item__menu-arrow',
  MENU_ITEM__BUTTON_TITLE: 'menu-item__button-title',
  MENU_ITEM__LINK_TITLE: 'menu-item__link-title',
  MENU_ITEM__LINK_TITLE_SPAN: 'menu-item__link-title-span',
  MENU_ITEM__SELECTED: 'menu-item--selected',
  MENU_ITEM__SELECTED_PARENT: 'menu-item--selected_parent',
  MENU_ITEM__TITLE: 'menu-item__title',
  MENU_ITEM__FLY_OUT: 'menu-item--fly_out',
  MENU_ITEM__INLINE: 'menu-item--inline',
  MENU_ITEM__MEGA_MENU: 'menu-item--mega-menu',

  DESKTOP__HIDDEN: 'header-desktop--hidden',
  MOBILE__HIDDEN: 'header-mobile--hidden',
  MOBILE__GGP_ID: 'header-mobile__id-wrapper',
  MOBILE__VIP_ACTION_ITEMS__LEFT: 'header-mobile__vip-action-items--left',
  MOBILE__VIP_ACTION_ITEMS__RIGHT: 'header-mobile__vip-action-items--right',

  ACTION_ITEM__SELECTED: 'header-mobile-menu__action-item--selected',
  MOBILE_MENU: 'header-mobile-menu',
  MOBILE_MENU__ACTION_BAR: 'header-mobile-menu__action-bar',
  MOBILE_MENU__BACKDROP: 'header-mobile-menu__backdrop',
  MOBILE_MENU__CONTENT: 'header-mobile-menu__content',
  MOBILE_MENU__CONTENT_ITEM: 'header-mobile-menu__content-item',
  MOBILE_MENU__LAST_FOCUSABLE: 'header-mobile-menu__hidden-last-focusable',
  MOBILE_MENU__WRAPPER: 'header-mobile-menu__wrapper',

  MOBILE_MENU_ACTON_BAR__HOME_ID: 'header-mobile-menu_action-bar__home',
  MOBILE_MENU_ACTON_BAR__PROFILE_ID: 'header-mobile-menu_action-bar__profile',
  MOBILE_MENU_ACTION_BAR__ACTION_ITEM_WRAPPER: 'header-mobile-menu__action-item',

  VERTICAL_MENU: 'vertical-menu',
  VERTICAL_MENU__BUTTON_TITLE: 'vertical-menu__button-title',
  VERTICAL_MENU__CHEVRON: 'vertical-menu__chevron',
  VERTICAL_MENU__DIVIDER: 'vertical-menu__divider',
  VERTICAL_MENU__LINK_TEXT: 'vertical-menu__link-text',
  VERTICAL_MENU__LINK_TITLE: 'vertical-menu__link-title',
  VERTICAL_MENU__PLAIN_TITLE: 'vertical-menu__plain-title',
  VERTICAL_MENU__TITLE: 'vertical-menu__title',

  VERTICAL_MENU_WRAPPER__WRAPPER: 'vertical-menu__wrapper',
  VERTICAL_MENU_WRAPPER__WRAPPER_TITLE: 'vertical-menu__wrapper-title',

  POPUP__HIDDEN: 'popup__wrapper--hidden',
  POPUP__VISIBLE: 'popup__wrapper--visible',
  POPUP__WRAPPER: 'popup__wrapper',

  EXTERNAL_LINK: 'icon-after-external-link',
  EXTERNAL_LINK__NEW_TAB: 'new-tab-link-a11y',

  POPUP_ARROW: 'popup__arrow',
  POPUP_CONTENT_WRAPPER: 'popup__content',
  POPUP_WRAPPER: 'popup__wrapper',

  SEARCH__SEARCH_BACKDROP: 'search-backdrop',
  SEARCH__SEARCH_CLOSE_BUTTON: 'search-modal__close-button',
  SEARCH__SEARCH_BUTTON: 'search-modal__button',
  SEARCH__SEARCH_BUTTON_WRAPPER: 'search-modal__button-wrapper',
  SEARCH__SEARCH_INPUT: 'search-modal__input',
  SEARCH__SEARCH_MODAL: 'search-modal',

  SIZE__LARGE: 'large',
  SIZE__MEDIUM: 'medium',

  SKIP_LINK_LINK: 'skip-link__link',
  SKIP_LINK_WRAPPER: 'skip-link__wrapper',

  TITLE: 'title-wrapper',
  TITLE__LOGO: 'title-wrapper__logo',
  TITLE__TITLE: 'title-wrapper__title',

  TOOLTIP: 'tooltip',
  TOOLTIP__CONTENT: 'tooltip__content',
  TOOLTIP__WRAPPER: 'tooltip__wrapper',
  TOOLTIP__WRAPPER__HIDDEN: 'tooltip__wrapper--hidden',
  TOOLTIP__WRAPPER__VISIBLE: 'tooltip__wrapper--visible',

  GGP_ID: 'id-wrapper',
  GGP_ID__BUTTON: 'id__button',
}
