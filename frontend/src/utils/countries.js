import countriesLib from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';

countriesLib.registerLocale(enLocale);

// TODO: Switch to exporting objects with { code, name } to use ISO codes as values in dropdowns
export const countries = Object.values(countriesLib.getNames('en'));
