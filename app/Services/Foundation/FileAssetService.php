<?php

namespace App\Services\Foundation;

use App\Models\FileAsset;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class FileAssetService
{
    public function replaceSingleImage(
        Model $owner,
        mixed $uploadedFile,
        string $directory,
        string $collection = 'primary_image',
        string $disk = 'public',
    ): ?FileAsset {
        if (! $uploadedFile instanceof UploadedFile) {
            return $owner->relationLoaded('primaryImage') ? $owner->primaryImage : $owner->primaryImage()->first();
        }

        $this->deleteCollection($owner, $collection);

        /** @var FileAsset $asset */
        $asset = $owner->fileAssets()->create([
            'business_id' => (string) $owner->business_id,
            'collection' => $collection,
            'disk' => $disk,
            'path' => $uploadedFile->store($directory, $disk),
            'original_name' => $uploadedFile->getClientOriginalName(),
            'mime_type' => $uploadedFile->getClientMimeType(),
            'file_size' => $uploadedFile->getSize(),
            'sort_order' => 0,
            'uploaded_by' => auth()->id(),
        ]);

        $owner->unsetRelation('primaryImage');
        $owner->unsetRelation('fileAssets');

        return $asset;
    }

    public function deleteCollection(Model $owner, string $collection = 'primary_image'): void
    {
        $owner->fileAssets()
            ->where('collection', $collection)
            ->get()
            ->each(fn (FileAsset $asset) => $this->deleteAsset($asset));

        $owner->unsetRelation('primaryImage');
        $owner->unsetRelation('fileAssets');
    }

    public function deleteAll(Model $owner): void
    {
        $owner->fileAssets()->get()->each(fn (FileAsset $asset) => $this->deleteAsset($asset));

        $owner->unsetRelation('primaryImage');
        $owner->unsetRelation('fileAssets');
    }

    public function createLegacyAsset(
        string $businessId,
        string $attachableType,
        string $attachableId,
        string $path,
        string $collection = 'primary_image',
        string $disk = 'public',
    ): void {
        if (! filled($path)) {
            return;
        }

        FileAsset::withoutEvents(function () use ($businessId, $attachableType, $attachableId, $path, $collection, $disk): void {
            FileAsset::query()->create([
                'business_id' => $businessId,
                'attachable_type' => $attachableType,
                'attachable_id' => $attachableId,
                'collection' => $collection,
                'disk' => $disk,
                'path' => $path,
                'sort_order' => 0,
            ]);
        });
    }

    protected function deleteAsset(FileAsset $asset): void
    {
        $path = $asset->path;

        if (
            filled($path)
            && ! str_starts_with($path, 'http://')
            && ! str_starts_with($path, 'https://')
            && ! str_starts_with($path, '/')
            && Storage::disk($asset->disk ?: 'public')->exists($path)
        ) {
            Storage::disk($asset->disk ?: 'public')->delete($path);
        }

        $asset->delete();
    }
}
