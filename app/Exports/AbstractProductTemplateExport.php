<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStrictNullComparison;

abstract class AbstractProductTemplateExport implements FromArray, WithHeadings, WithMapping, WithStrictNullComparison
{
    abstract public function headings(): array;

    abstract protected function sampleRows(): array;

    public function array(): array
    {
        $headings = $this->headings();

        return array_map(
            fn (array $row): array => array_map(
                fn (string $heading): mixed => $row[$heading] ?? '',
                $headings
            ),
            $this->sampleRows()
        );
    }

    public function map(mixed $row): array
    {
        return $row;
    }
}
