/// <reference lib="webworker" />

import { expose } from 'comlink';
import { Document, Page, Text, View, pdf } from '@react-pdf/renderer';

import type { PdfBlock, PdfExportPayload, PdfThemeColors, PdfTypography } from '@/utils/pdf-export-types';
import './workerShim';

const pxToPt = (px: number) => px * 0.75;

const resolvePdfFontFamily = (raw: string, mono = false) => {
  const value = raw.toLowerCase();
  if (value.includes('courier')) return 'Courier';
  if (value.includes('times')) return 'Times-Roman';
  if (value.includes('helvetica') || value.includes('arial') || value.includes('sans')) return 'Helvetica';
  return mono ? 'Courier' : 'Helvetica';
};

const asWeight = (value: number) => (value >= 600 ? 'bold' : 'normal');

const headingStyle = (level: number, typography: PdfTypography) => {
  const size =
    level === 1
      ? typography.headingFontSizePx[1]
      : level === 2
        ? typography.headingFontSizePx[2]
        : level === 3
          ? typography.headingFontSizePx[3]
          : level === 4
            ? typography.headingFontSizePx[4]
            : level === 5
              ? typography.headingFontSizePx[5]
              : typography.headingFontSizePx[6];

  return {
    fontSize: pxToPt(size),
    fontWeight: asWeight(typography.headingFontWeight),
    marginTop: pxToPt(typography.headingMarginTopPx),
    marginBottom: pxToPt(typography.headingMarginBottomPx),
    lineHeight: typography.headingLineHeight,
  };
};

const createStyles = (typography: PdfTypography) => {
  const sans = resolvePdfFontFamily(typography.fontSans);
  const mono = resolvePdfFontFamily(typography.fontMono, true);

  return {
    page: {
      paddingTop: pxToPt(typography.pagePaddingVerticalPx),
      paddingBottom: pxToPt(typography.pagePaddingVerticalPx),
      paddingHorizontal: pxToPt(typography.pagePaddingHorizontalPx),
      fontFamily: sans,
      fontSize: pxToPt(typography.baseFontSizePx),
      lineHeight: typography.baseLineHeight,
    },
    pageTitle: {
      fontFamily: sans,
      fontSize: pxToPt(typography.titleFontSizePx),
      lineHeight: typography.titleLineHeight,
      fontWeight: asWeight(typography.titleFontWeight),
      marginTop: pxToPt(typography.titleMarginTopPx),
      marginBottom: pxToPt(typography.titleMarginBottomPx),
      letterSpacing: pxToPt(typography.titleLetterSpacingPx),
    },
    paragraph: {
      marginBottom: pxToPt(typography.paragraphMarginBottomPx),
      fontSize: pxToPt(typography.baseFontSizePx),
      lineHeight: typography.baseLineHeight,
      fontFamily: sans,
    },
    listContainer: {
      marginBottom: pxToPt(typography.paragraphMarginBottomPx),
      paddingLeft: pxToPt(typography.listIndentPx),
    },
    listItem: {
      marginBottom: pxToPt(typography.listItemGapPx),
      fontSize: pxToPt(typography.baseFontSizePx),
      lineHeight: typography.baseLineHeight,
      fontFamily: sans,
    },
    taskListContainer: {
      marginBottom: pxToPt(typography.paragraphMarginBottomPx),
      paddingLeft: pxToPt(typography.taskListIndentPx),
    },
    taskItem: {
      flexDirection: 'row' as const,
      marginBottom: pxToPt(typography.taskItemGapPx),
    },
    taskCheckbox: {
      width: pxToPt(10),
      height: pxToPt(10),
      borderWidth: 1,
      borderRadius: pxToPt(2),
      marginTop: pxToPt(3),
      marginRight: pxToPt(typography.taskItemGapPx),
    },
    taskCheckboxChecked: {
      width: pxToPt(10),
      height: pxToPt(10),
      borderWidth: 1,
      borderRadius: pxToPt(2),
      marginTop: pxToPt(3),
      marginRight: pxToPt(typography.taskItemGapPx),
    },
    codeBlock: {
      fontFamily: mono,
      fontSize: pxToPt(typography.codeFontSizePx),
      lineHeight: typography.codeLineHeight,
      marginTop: pxToPt(typography.codeBlockMarginTopPx),
      marginBottom: pxToPt(typography.codeBlockMarginBottomPx),
      padding: pxToPt(typography.codeBlockPaddingPx),
      borderRadius: pxToPt(6),
      borderWidth: 1,
    },
    blockquote: {
      marginTop: pxToPt(typography.blockquoteMarginTopPx),
      marginBottom: pxToPt(typography.blockquoteMarginBottomPx),
      paddingLeft: pxToPt(typography.blockquotePaddingLeftPx),
      paddingRight: pxToPt(typography.blockquotePaddingRightPx),
      paddingVertical: pxToPt(typography.blockquotePaddingVerticalPx),
      borderLeftWidth: pxToPt(3),
      borderRadius: pxToPt(4),
    },
    hr: {
      borderBottomWidth: 1,
      marginVertical: pxToPt(typography.horizontalRuleMarginPx),
    },
    table: {
      marginTop: pxToPt(typography.tableMarginTopPx),
      marginBottom: pxToPt(typography.tableMarginBottomPx),
      borderWidth: 1,
      borderRadius: pxToPt(6),
      overflow: 'hidden' as const,
    },
    tableRow: {
      flexDirection: 'row' as const,
    },
    tableHeaderCell: {
      flexGrow: 1,
      flexBasis: 0,
      paddingVertical: pxToPt(typography.tableCellPaddingVerticalPx),
      paddingHorizontal: pxToPt(typography.tableCellPaddingHorizontalPx),
      fontWeight: 'bold',
      fontSize: pxToPt(typography.baseFontSizePx),
      borderRightWidth: 1,
      borderBottomWidth: 1,
      fontFamily: sans,
      lineHeight: typography.baseLineHeight,
    },
    tableCell: {
      flexGrow: 1,
      flexBasis: 0,
      paddingVertical: pxToPt(typography.tableCellPaddingVerticalPx),
      paddingHorizontal: pxToPt(typography.tableCellPaddingHorizontalPx),
      fontSize: pxToPt(typography.baseFontSizePx),
      lineHeight: typography.baseLineHeight,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      fontFamily: sans,
    },
    emptyText: {
      fontSize: pxToPt(typography.baseFontSizePx),
      opacity: 0.5,
      fontStyle: 'italic' as const,
      fontFamily: sans,
    },
  };
};

const renderBlock = (block: PdfBlock, theme: PdfThemeColors, typography: PdfTypography, key: string) => {
  const s = createStyles(typography);

  if (block.type === 'heading') {
    return (
      <Text key={key} style={[headingStyle(block.level, typography), { color: theme.headingColor }]}> 
        {block.text}
      </Text>
    );
  }

  if (block.type === 'paragraph') {
    return (
      <Text key={key} style={[s.paragraph, { color: theme.foreground }]} orphans={2} widows={2}>
        {block.text}
      </Text>
    );
  }

  if (block.type === 'horizontalRule') {
    return <View key={key} style={[s.hr, { borderBottomColor: theme.hrColor }]} />;
  }

  if (block.type === 'list') {
    return (
      <View key={key} style={s.listContainer}>
        {block.items.map((item, index) => (
          <Text key={`${key}-li-${index}`} style={[s.listItem, { color: theme.foreground }]}>
            {block.ordered ? `${index + 1}. ` : '•  '}
            {item}
          </Text>
        ))}
      </View>
    );
  }

  if (block.type === 'taskList') {
    return (
      <View key={key} style={s.taskListContainer}>
        {block.items.map((item, index) => (
          <View key={`${key}-task-${index}`} style={s.taskItem}>
            <View
              style={[
                item.checked ? s.taskCheckboxChecked : s.taskCheckbox,
                {
                  borderColor: theme.foreground,
                  backgroundColor: item.checked
                    ? theme.dark
                      ? 'rgba(255,255,255,0.15)'
                      : 'rgba(0,0,0,0.1)'
                    : 'transparent',
                },
              ]}
            />
            <Text
              style={[
                s.listItem,
                {
                  color: theme.foreground,
                  opacity: item.checked ? 0.55 : 1,
                  textDecoration: item.checked ? 'line-through' : 'none',
                },
              ]}
            >
              {item.text}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  if (block.type === 'code') {
    return (
      <Text
        key={key}
        style={[
          s.codeBlock,
          {
            color: theme.foreground,
            backgroundColor: theme.codeBlockBg,
            borderColor: theme.codeBlockBorder,
          },
        ]}
      >
        {block.text}
      </Text>
    );
  }

  if (block.type === 'quote') {
    return (
      <View
        key={key}
        style={[
          s.blockquote,
          {
            borderLeftColor: theme.blockquoteBorder,
            backgroundColor: theme.blockquoteBg,
          },
        ]}
      >
        <Text
          style={{
            color: theme.blockquoteText,
            fontSize: pxToPt(typography.baseFontSizePx),
            lineHeight: typography.baseLineHeight,
          }}
        >
          {block.text}
        </Text>
      </View>
    );
  }

  return (
    <View key={key} style={[s.table, { borderColor: theme.tableBorder }]}>
      {block.rows.map((row, rowIndex) => {
        const isHeader = rowIndex === 0;

        return (
          <View
            key={`${key}-row-${rowIndex}`}
            style={[s.tableRow, isHeader ? { backgroundColor: theme.tableHeaderBg } : {}]}
          >
            {row.map((cell, cellIndex) => (
              <Text
                key={`${key}-cell-${rowIndex}-${cellIndex}`}
                style={[
                  isHeader ? s.tableHeaderCell : s.tableCell,
                  {
                    color: isHeader ? theme.tableHeaderFg : theme.tableText,
                    borderColor: theme.tableBorder,
                    borderRightWidth: cellIndex === row.length - 1 ? 0 : 1,
                    borderBottomWidth: rowIndex === block.rows.length - 1 ? 0 : 1,
                  },
                ]}
              >
                {cell}
              </Text>
            ))}
          </View>
        );
      })}
    </View>
  );
};

const renderPDFInWorker = async (payload: PdfExportPayload) => {
  const theme = payload.theme;
  const typography = payload.typography;
  const s = createStyles(typography);

  const doc = (
    <Document title={payload.title}>
      {payload.pages.map((page, pageIndex) => (
        <Page
          key={`${page.title}-${pageIndex}`}
          size="A4"
          style={[s.page, { backgroundColor: theme.pageBg }]}
        >
          <Text style={[s.pageTitle, { color: theme.headingColor }]}>{page.title}</Text>
          {page.blocks.length === 0 ? (
            <Text style={[s.emptyText, { color: theme.foreground }]}>No content yet.</Text>
          ) : (
            page.blocks.map((block, blockIndex) =>
              renderBlock(block, theme, typography, `${pageIndex}-${blockIndex}`),
            )
          )}
        </Page>
      ))}
    </Document>
  );

  const blob = await pdf(doc).toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
};

expose({ renderPDFInWorker });

export type PdfWorkerApi = {
  renderPDFInWorker: (payload: PdfExportPayload) => Promise<Uint8Array>;
};
