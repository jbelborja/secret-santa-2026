import { es } from '../lib/i18n/translations/es';
import { en } from '../lib/i18n/translations/en';

describe('i18n Translations', () => {
  function getNestedKeys(obj: Record<string, any>, prefix = ''): string[] {
    return Object.keys(obj).reduce((res: string[], el: string) => {
      const name = prefix ? `${prefix}.${el}` : el;
      if (typeof obj[el] === 'object' && obj[el] !== null && !Array.isArray(obj[el])) {
        return [...res, ...getNestedKeys(obj[el], name)];
      }
      return [...res, name];
    }, []);
  }

  test('Spanish and English should have the exact same translation keys', () => {
    const esKeys = getNestedKeys(es).sort();
    const enKeys = getNestedKeys(en).sort();

    expect(esKeys).toEqual(enKeys);
  });

  test('Spanish translations should default to Spanish terminology', () => {
    expect(es.auth.appName).toBe('Amigo Invisible');
    expect(es.tabs.myRaffles).toBe('Mis Sorteos');
    expect(es.profile.language).toBe('Idioma');
    expect(es.status.draft).toBe('Borrador');
    expect(es.status.inviting).toBe('Abierto');
    expect(es.status.drawn).toBe('Sorteado');
    expect(es.timer.days).toBe('Días');
  });

  test('English translations should have English terminology', () => {
    expect(en.auth.appName).toBe('Secret Santa');
    expect(en.tabs.myRaffles).toBe('My Raffles');
    expect(en.profile.language).toBe('Language');
    expect(en.status.draft).toBe('Draft');
    expect(en.status.inviting).toBe('Open');
    expect(en.status.drawn).toBe('Drawn');
    expect(en.timer.days).toBe('Days');
  });

  test('String interpolation parameters match between ES and EN', () => {
    const esKeys = getNestedKeys(es);
    const paramRegex = /\{([^}]+)\}/g;

    for (const key of esKeys) {
      const parts = key.split('.');
      let esVal: any = es;
      let enVal: any = en;
      for (const p of parts) {
        esVal = esVal[p];
        enVal = enVal[p];
      }

      if (typeof esVal === 'string' && typeof enVal === 'string') {
        const esMatches = (esVal.match(paramRegex) || []).sort();
        const enMatches = (enVal.match(paramRegex) || []).sort();
        expect(esMatches).toEqual(enMatches);
      }
    }
  });
});
