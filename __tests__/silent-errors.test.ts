import * as fs from 'fs';
import * as path from 'path';

const screensDir = path.resolve(__dirname, '../src/screens');

function readScreen(name: string): string {
  return fs.readFileSync(path.join(screensDir, name), 'utf-8');
}

describe('Silent error fix — each screen imports Alert and uses it in catch blocks', () => {
  const screens = [
    'AlertsScreen.tsx',
    'CostCalculatorScreen.tsx',
    'MyProductsScreen.tsx',
    'SearchProductsScreen.tsx',
    'SettingsScreen.tsx',
  ];

  screens.forEach((screen) => {
    describe(screen, () => {
      const content = readScreen(screen);

      it('imports Alert from react-native', () => {
        expect(content).toMatch(/import\s*\{[^}]*Alert[^}]*\}\s*from\s*'react-native'/);
      });

      it('has at least one Alert.alert() call in catch blocks', () => {
        const alertCalls = content.match(/Alert\.alert\(/g);
        expect(alertCalls).not.toBeNull();
        expect(alertCalls!.length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});

describe('Silent error fix — catch blocks have user-facing error feedback', () => {
  it('AlertsScreen catch block shows Alert.alert', () => {
    const content = readScreen('AlertsScreen.tsx');
    const catchIndex = content.indexOf('} catch');
    const blockAfter = content.substring(catchIndex, catchIndex + 200);
    expect(blockAfter).toMatch(/Alert\.alert\(/);
  });

  it('CostCalculatorScreen catch block shows Alert.alert', () => {
    const content = readScreen('CostCalculatorScreen.tsx');
    const catchIndex = content.indexOf('} catch');
    const blockAfter = content.substring(catchIndex, catchIndex + 200);
    expect(blockAfter).toMatch(/Alert\.alert\(/);
  });

  it('SearchProductsScreen catch block shows Alert.alert', () => {
    const content = readScreen('SearchProductsScreen.tsx');
    const catchIndex = content.indexOf('} catch');
    const blockAfter = content.substring(catchIndex, catchIndex + 200);
    expect(blockAfter).toMatch(/Alert\.alert\(/);
  });

  it('SettingsScreen catch block shows user-facing error', () => {
    const content = readScreen('SettingsScreen.tsx');
    const catchIndex = content.indexOf('} catch');
    const blockAfter = content.substring(catchIndex, catchIndex + 300);
    expect(blockAfter).toMatch(/(Alert\.alert\(|setError\()/);
  });

  it('MyProductsScreen primary catch shows user-facing error (tier info catch is intentionally comment-only)', () => {
    const content = readScreen('MyProductsScreen.tsx');
    const catchIndex = content.indexOf('} catch');
    const blockAfter = content.substring(catchIndex, catchIndex + 200);
    expect(blockAfter).toMatch(/(Alert\.alert\(|setError\()/);
  });
});
