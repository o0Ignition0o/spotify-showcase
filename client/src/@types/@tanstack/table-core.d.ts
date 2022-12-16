import '@tanstack/react-table';

declare module '@tanstack/table-core' {
  interface ColumnMeta<TData extends RowData, TValue> {
    headerAlign?: 'left' | 'center' | 'right';
    shrink?: boolean;
  }

  interface TableMeta<TData extends RowData> {
    [key: string]: any;
  }
}
