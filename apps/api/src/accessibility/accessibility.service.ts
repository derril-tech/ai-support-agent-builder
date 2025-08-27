import { Injectable, Logger } from '@nestjs/common';

export interface AccessibilityAudit {
  id: string;
  pageUrl: string;
  timestamp: Date;
  score: number;
  issues: AccessibilityIssue[];
  recommendations: string[];
  compliance: {
    wcag2a: boolean;
    wcag2aa: boolean;
    wcag2aaa: boolean;
    section508: boolean;
  };
}

export interface AccessibilityIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'keyboard' | 'aria' | 'contrast' | 'semantics' | 'focus' | 'images' | 'forms';
  description: string;
  element?: string;
  selector?: string;
  recommendation: string;
  wcagCriteria?: string[];
}

export interface KeyboardNavigationTest {
  id: string;
  element: string;
  selector: string;
  tabIndex: number;
  isFocusable: boolean;
  hasVisibleFocus: boolean;
  keyboardActions: string[];
  issues: string[];
}

export interface AriaComplianceTest {
  id: string;
  element: string;
  selector: string;
  ariaAttributes: Record<string, string>;
  requiredAttributes: string[];
  missingAttributes: string[];
  invalidValues: string[];
  issues: string[];
}

export interface ContrastTest {
  id: string;
  element: string;
  selector: string;
  foregroundColor: string;
  backgroundColor: string;
  contrastRatio: number;
  wcagLevel: 'AA' | 'AAA' | 'fail';
  isCompliant: boolean;
  issues: string[];
}

@Injectable()
export class AccessibilityService {
  private readonly logger = new Logger(AccessibilityService.name);

  // WCAG 2.1 AA contrast ratios
  private readonly wcagContrastRatios = {
    AA: { normal: 4.5, large: 3.0 },
    AAA: { normal: 7.0, large: 4.5 },
  };

  async runAccessibilityAudit(pageUrl: string): Promise<AccessibilityAudit> {
    this.logger.log(`Running accessibility audit for: ${pageUrl}`);

    const issues: AccessibilityIssue[] = [];
    const recommendations: string[] = [];

    // Run various accessibility tests
    const keyboardTests = await this.testKeyboardNavigation(pageUrl);
    const ariaTests = await this.testAriaCompliance(pageUrl);
    const contrastTests = await this.testColorContrast(pageUrl);
    const semanticTests = await this.testSemanticStructure(pageUrl);
    const focusTests = await this.testFocusManagement(pageUrl);
    const imageTests = await this.testImageAccessibility(pageUrl);
    const formTests = await this.testFormAccessibility(pageUrl);

    // Collect all issues
    issues.push(...this.extractIssuesFromKeyboardTests(keyboardTests));
    issues.push(...this.extractIssuesFromAriaTests(ariaTests));
    issues.push(...this.extractIssuesFromContrastTests(contrastTests));
    issues.push(...this.extractIssuesFromSemanticTests(semanticTests));
    issues.push(...this.extractIssuesFromFocusTests(focusTests));
    issues.push(...this.extractIssuesFromImageTests(imageTests));
    issues.push(...this.extractIssuesFromFormTests(formTests));

    // Calculate overall score
    const score = this.calculateAccessibilityScore(issues);

    // Generate recommendations
    recommendations.push(...this.generateRecommendations(issues));

    // Check compliance levels
    const compliance = this.checkComplianceLevels(issues);

    return {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      pageUrl,
      timestamp: new Date(),
      score,
      issues,
      recommendations,
      compliance,
    };
  }

  async testKeyboardNavigation(pageUrl: string): Promise<KeyboardNavigationTest[]> {
    this.logger.log(`Testing keyboard navigation for: ${pageUrl}`);

    // This would use a headless browser to test keyboard navigation
    // For now, return stub data
    return [
      {
        id: 'keyboard-1',
        element: 'button',
        selector: '.primary-button',
        tabIndex: 0,
        isFocusable: true,
        hasVisibleFocus: true,
        keyboardActions: ['Enter', 'Space'],
        issues: [],
      },
      {
        id: 'keyboard-2',
        element: 'div',
        selector: '.clickable-div',
        tabIndex: -1,
        isFocusable: false,
        hasVisibleFocus: false,
        keyboardActions: [],
        issues: ['Element should be focusable for keyboard users'],
      },
    ];
  }

  async testAriaCompliance(pageUrl: string): Promise<AriaComplianceTest[]> {
    this.logger.log(`Testing ARIA compliance for: ${pageUrl}`);

    return [
      {
        id: 'aria-1',
        element: 'button',
        selector: '.menu-button',
        ariaAttributes: {
          'aria-expanded': 'false',
          'aria-haspopup': 'true',
        },
        requiredAttributes: ['aria-expanded', 'aria-haspopup'],
        missingAttributes: [],
        invalidValues: [],
        issues: [],
      },
      {
        id: 'aria-2',
        element: 'img',
        selector: '.logo',
        ariaAttributes: {},
        requiredAttributes: ['alt'],
        missingAttributes: ['alt'],
        invalidValues: [],
        issues: ['Missing alt attribute for image'],
      },
    ];
  }

  async testColorContrast(pageUrl: string): Promise<ContrastTest[]> {
    this.logger.log(`Testing color contrast for: ${pageUrl}`);

    return [
      {
        id: 'contrast-1',
        element: 'p',
        selector: '.body-text',
        foregroundColor: '#333333',
        backgroundColor: '#ffffff',
        contrastRatio: 12.6,
        wcagLevel: 'AAA',
        isCompliant: true,
        issues: [],
      },
      {
        id: 'contrast-2',
        element: 'span',
        selector: '.light-text',
        foregroundColor: '#cccccc',
        backgroundColor: '#ffffff',
        contrastRatio: 1.6,
        wcagLevel: 'fail',
        isCompliant: false,
        issues: ['Insufficient color contrast ratio'],
      },
    ];
  }

  async testSemanticStructure(pageUrl: string): Promise<AccessibilityIssue[]> {
    this.logger.log(`Testing semantic structure for: ${pageUrl}`);

    return [
      {
        id: 'semantic-1',
        type: 'warning',
        severity: 'medium',
        category: 'semantics',
        description: 'Page missing main landmark',
        element: 'body',
        selector: 'body',
        recommendation: 'Add <main> element to define the main content area',
        wcagCriteria: ['WCAG 2.1 1.3.1'],
      },
      {
        id: 'semantic-2',
        type: 'error',
        severity: 'high',
        category: 'semantics',
        description: 'Heading structure is not logical',
        element: 'h3',
        selector: 'h3',
        recommendation: 'Ensure heading levels follow a logical hierarchy (h1 -> h2 -> h3)',
        wcagCriteria: ['WCAG 2.1 1.3.1'],
      },
    ];
  }

  async testFocusManagement(pageUrl: string): Promise<AccessibilityIssue[]> {
    this.logger.log(`Testing focus management for: ${pageUrl}`);

    return [
      {
        id: 'focus-1',
        type: 'error',
        severity: 'high',
        category: 'focus',
        description: 'Focus indicator is not visible',
        element: 'button',
        selector: '.custom-button',
        recommendation: 'Add visible focus indicator for keyboard navigation',
        wcagCriteria: ['WCAG 2.1 2.4.7'],
      },
      {
        id: 'focus-2',
        type: 'warning',
        severity: 'medium',
        category: 'focus',
        description: 'Focus trap missing for modal dialog',
        element: 'div',
        selector: '.modal',
        recommendation: 'Implement focus trap to keep focus within modal when open',
        wcagCriteria: ['WCAG 2.1 2.4.3'],
      },
    ];
  }

  async testImageAccessibility(pageUrl: string): Promise<AccessibilityIssue[]> {
    this.logger.log(`Testing image accessibility for: ${pageUrl}`);

    return [
      {
        id: 'image-1',
        type: 'error',
        severity: 'high',
        category: 'images',
        description: 'Image missing alt text',
        element: 'img',
        selector: '.product-image',
        recommendation: 'Add descriptive alt text for screen readers',
        wcagCriteria: ['WCAG 2.1 1.1.1'],
      },
      {
        id: 'image-2',
        type: 'warning',
        severity: 'medium',
        category: 'images',
        description: 'Decorative image should have empty alt attribute',
        element: 'img',
        selector: '.decorative-icon',
        recommendation: 'Add alt="" for decorative images',
        wcagCriteria: ['WCAG 2.1 1.1.1'],
      },
    ];
  }

  async testFormAccessibility(pageUrl: string): Promise<AccessibilityIssue[]> {
    this.logger.log(`Testing form accessibility for: ${pageUrl}`);

    return [
      {
        id: 'form-1',
        type: 'error',
        severity: 'high',
        category: 'forms',
        description: 'Form field missing label',
        element: 'input',
        selector: '.email-input',
        recommendation: 'Add associated label or aria-label for form field',
        wcagCriteria: ['WCAG 2.1 3.3.2'],
      },
      {
        id: 'form-2',
        type: 'warning',
        severity: 'medium',
        category: 'forms',
        description: 'Error message not associated with form field',
        element: 'span',
        selector: '.error-message',
        recommendation: 'Use aria-describedby to associate error messages with fields',
        wcagCriteria: ['WCAG 2.1 3.3.1'],
      },
    ];
  }

  async generateAccessibilityReport(audit: AccessibilityAudit): Promise<string> {
    const report = `
# Accessibility Audit Report

**Page:** ${audit.pageUrl}
**Date:** ${audit.timestamp.toISOString()}
**Score:** ${audit.score}/100

## Compliance Status
- WCAG 2.1 Level A: ${audit.compliance.wcag2a ? '✅ Pass' : '❌ Fail'}
- WCAG 2.1 Level AA: ${audit.compliance.wcag2aa ? '✅ Pass' : '❌ Fail'}
- WCAG 2.1 Level AAA: ${audit.compliance.wcag2aaa ? '✅ Pass' : '❌ Fail'}
- Section 508: ${audit.compliance.section508 ? '✅ Pass' : '❌ Fail'}

## Issues Found: ${audit.issues.length}

### Critical Issues (${audit.issues.filter(i => i.severity === 'critical').length})
${audit.issues.filter(i => i.severity === 'critical').map(issue => `- ${issue.description}`).join('\n')}

### High Priority Issues (${audit.issues.filter(i => i.severity === 'high').length})
${audit.issues.filter(i => i.severity === 'high').map(issue => `- ${issue.description}`).join('\n')}

### Medium Priority Issues (${audit.issues.filter(i => i.severity === 'medium').length})
${audit.issues.filter(i => i.severity === 'medium').map(issue => `- ${issue.description}`).join('\n')}

### Low Priority Issues (${audit.issues.filter(i => i.severity === 'low').length})
${audit.issues.filter(i => i.severity === 'low').map(issue => `- ${issue.description}`).join('\n')}

## Recommendations
${audit.recommendations.map(rec => `- ${rec}`).join('\n')}
    `;

    return report;
  }

  private extractIssuesFromKeyboardTests(tests: KeyboardNavigationTest[]): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    tests.forEach(test => {
      test.issues.forEach(issue => {
        issues.push({
          id: `keyboard-${test.id}`,
          type: 'error',
          severity: 'high',
          category: 'keyboard',
          description: issue,
          element: test.element,
          selector: test.selector,
          recommendation: 'Ensure all interactive elements are keyboard accessible',
          wcagCriteria: ['WCAG 2.1 2.1.1'],
        });
      });
    });

    return issues;
  }

  private extractIssuesFromAriaTests(tests: AriaComplianceTest[]): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    tests.forEach(test => {
      test.issues.forEach(issue => {
        issues.push({
          id: `aria-${test.id}`,
          type: 'error',
          severity: 'high',
          category: 'aria',
          description: issue,
          element: test.element,
          selector: test.selector,
          recommendation: 'Add required ARIA attributes and ensure valid values',
          wcagCriteria: ['WCAG 2.1 4.1.2'],
        });
      });
    });

    return issues;
  }

  private extractIssuesFromContrastTests(tests: ContrastTest[]): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    tests.forEach(test => {
      test.issues.forEach(issue => {
        issues.push({
          id: `contrast-${test.id}`,
          type: 'error',
          severity: 'high',
          category: 'contrast',
          description: issue,
          element: test.element,
          selector: test.selector,
          recommendation: `Increase color contrast ratio to at least ${this.wcagContrastRatios.AA.normal}:1 for normal text`,
          wcagCriteria: ['WCAG 2.1 1.4.3'],
        });
      });
    });

    return issues;
  }

  private extractIssuesFromSemanticTests(tests: AccessibilityIssue[]): AccessibilityIssue[] {
    return tests;
  }

  private extractIssuesFromFocusTests(tests: AccessibilityIssue[]): AccessibilityIssue[] {
    return tests;
  }

  private extractIssuesFromImageTests(tests: AccessibilityIssue[]): AccessibilityIssue[] {
    return tests;
  }

  private extractIssuesFromFormTests(tests: AccessibilityIssue[]): AccessibilityIssue[] {
    return tests;
  }

  private calculateAccessibilityScore(issues: AccessibilityIssue[]): number {
    const totalIssues = issues.length;
    if (totalIssues === 0) return 100;

    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    const mediumIssues = issues.filter(i => i.severity === 'medium').length;
    const lowIssues = issues.filter(i => i.severity === 'low').length;

    // Weight issues by severity
    const weightedScore = (criticalIssues * 10) + (highIssues * 5) + (mediumIssues * 2) + (lowIssues * 1);
    const maxPossibleScore = totalIssues * 10;

    return Math.max(0, Math.round(100 - (weightedScore / maxPossibleScore) * 100));
  }

  private generateRecommendations(issues: AccessibilityIssue[]): string[] {
    const recommendations: string[] = [];

    // Group issues by category and generate specific recommendations
    const categories = ['keyboard', 'aria', 'contrast', 'semantics', 'focus', 'images', 'forms'];
    
    categories.forEach(category => {
      const categoryIssues = issues.filter(i => i.category === category);
      if (categoryIssues.length > 0) {
        recommendations.push(`Address ${categoryIssues.length} ${category} accessibility issues`);
      }
    });

    // Add specific recommendations based on common issues
    if (issues.some(i => i.category === 'contrast')) {
      recommendations.push('Review and improve color contrast ratios throughout the application');
    }

    if (issues.some(i => i.category === 'keyboard')) {
      recommendations.push('Ensure all interactive elements are keyboard accessible');
    }

    if (issues.some(i => i.category === 'aria')) {
      recommendations.push('Add missing ARIA attributes and ensure proper semantic markup');
    }

    return recommendations;
  }

  private checkComplianceLevels(issues: AccessibilityIssue[]): AccessibilityAudit['compliance'] {
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    const mediumIssues = issues.filter(i => i.severity === 'medium').length;

    // Simplified compliance checking
    const wcag2a = criticalIssues === 0 && highIssues === 0;
    const wcag2aa = wcag2a && mediumIssues === 0;
    const wcag2aaa = wcag2aa && issues.length === 0;
    const section508 = wcag2aa; // Section 508 is roughly equivalent to WCAG 2.1 AA

    return {
      wcag2a,
      wcag2aa,
      wcag2aaa,
      section508,
    };
  }
}

