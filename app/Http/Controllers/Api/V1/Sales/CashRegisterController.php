<?php

namespace App\Http\Controllers\Api\V1\Sales;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Sales\CloseCashRegisterSessionRequest;
use App\Http\Requests\Sales\OpenCashRegisterSessionRequest;
use App\Http\Requests\Sales\StoreCashRegisterRequest;
use App\Http\Requests\Sales\UpdateCashRegisterRequest;
use App\Http\Resources\Sales\CashRegisterResource;
use App\Http\Resources\Sales\CashRegisterSessionResource;
use App\Models\CashRegister;
use App\Models\CashRegisterSession;
use App\Services\Sales\CashRegisterService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CashRegisterController extends BaseApiController
{
    public function __construct(protected CashRegisterService $cashRegisters)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', CashRegister::class);

        $items = $this->cashRegisters->paginate($request->only([
            'search',
            'branch_id',
            'status',
            'per_page',
        ]));

        return $this->paginated($items, CashRegisterResource::class);
    }

    public function store(StoreCashRegisterRequest $request): JsonResponse
    {
        $this->authorize('create', CashRegister::class);

        $register = $this->cashRegisters->create(
            $request->user()->business_id,
            $request->validated(),
            $request->user()
        );

        return $this->success(new CashRegisterResource($register), 'Cash register created successfully.', 201);
    }

    public function show(CashRegister $cashRegister): JsonResponse
    {
        $this->authorize('view', $cashRegister);

        return $this->success(new CashRegisterResource($cashRegister->load([
            'branch',
            'sessions.user',
        ])->loadCount('sessions')));
    }

    public function update(UpdateCashRegisterRequest $request, CashRegister $cashRegister): JsonResponse
    {
        $this->authorize('update', $cashRegister);

        $register = $this->cashRegisters->update(
            $request->user()->business_id,
            $cashRegister,
            $request->validated(),
            $request->user()
        );

        return $this->success(new CashRegisterResource($register), 'Cash register updated successfully.');
    }

    public function destroy(Request $request, CashRegister $cashRegister): JsonResponse
    {
        $this->authorize('delete', $cashRegister);

        $this->cashRegisters->delete($request->user()->business_id, $cashRegister, $request->user());

        return $this->success(null, 'Cash register deleted successfully.');
    }

    public function openSession(OpenCashRegisterSessionRequest $request, CashRegister $cashRegister): JsonResponse
    {
        $this->authorize('openSession', $cashRegister);

        $session = $this->cashRegisters->openSession(
            $request->user()->business_id,
            $cashRegister,
            $request->validated(),
            $request->user()
        );

        return $this->success(new CashRegisterSessionResource($session), 'Cash register session opened successfully.', 201);
    }

    public function closeSession(CloseCashRegisterSessionRequest $request, CashRegisterSession $session): JsonResponse
    {
        $session->loadMissing('cashRegister');
        $this->authorize('closeSession', $session->cashRegister);

        $session = $this->cashRegisters->closeSession(
            $request->user()->business_id,
            $session,
            $request->validated(),
            $request->user()
        );

        return $this->success(new CashRegisterSessionResource($session), 'Cash register session closed successfully.');
    }
}
