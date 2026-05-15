<?php

namespace App\Http\Resources\Catalog;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class BrandResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'name' => $this->name,
            'description' => $this->description,
            'image_url' => $this->availableImageUrl($this->image_url),
            'products_count' => (int) ($this->products_count ?? 0),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    protected function availableImageUrl(?string $url): ?string
    {
        if (! filled($url)) {
            return null;
        }

        $publicDiskUrl = rtrim((string) config('filesystems.disks.public.url'), '/');

        if ($publicDiskUrl !== '' && str_starts_with($url, $publicDiskUrl.'/')) {
            $path = ltrim(substr($url, strlen($publicDiskUrl)), '/');

            return Storage::disk('public')->exists($path) ? $url : null;
        }

        if (str_starts_with($url, '/storage/')) {
            $path = substr($url, strlen('/storage/'));

            return Storage::disk('public')->exists($path) ? $url : null;
        }

        return $url;
    }
}
