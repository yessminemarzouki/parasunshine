<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\NewsletterSubscriber;
use Illuminate\Http\Request;

class AdminContactController extends Controller
{
    // ---- CONTACTS ----
    public function contacts(Request $request)
    {
        $query = Contact::latest();

        if ($request->has('is_read')) {
            $query->where('is_read', filter_var($request->is_read, FILTER_VALIDATE_BOOLEAN));
        }

        return response()->json($query->paginate($request->per_page ?? 20));
    }

    public function showContact(Contact $contact)
    {
        $contact->update(['is_read' => true]);
        return response()->json($contact);
    }

    public function deleteContact(Contact $contact)
    {
        $contact->delete();
        return response()->json(['message' => 'Message supprimé.']);
    }

    public function markRead(Contact $contact)
    {
        $contact->update(['is_read' => true]);
        return response()->json(['message' => 'Message marqué comme lu.']);
    }
    public function bulkMarkRead(Request $request)
    {
        $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'integer|exists:contacts,id',
        ]);

        Contact::whereIn('id', $request->ids)->update(['is_read' => true]);

        return response()->json([
            'message' => count($request->ids) . ' message(s) marqué(s) comme lu(s).',
        ]);
    }

    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'integer|exists:contacts,id',
        ]);

        Contact::whereIn('id', $request->ids)->delete();

        return response()->json([
            'message' => count($request->ids) . ' message(s) supprimé(s).',
        ]);
    }

    // ---- NEWSLETTER ----
    public function newsletter(Request $request)
    {
        $query = NewsletterSubscriber::latest();

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->search) {
            $query->where('email', 'like', '%' . $request->search . '%');
        }

        return response()->json($query->paginate($request->per_page ?? 50));
    }

    public function deleteSubscriber(NewsletterSubscriber $subscriber)
    {
        $subscriber->delete();
        return response()->json(['message' => 'Abonné supprimé.']);
    }
    public function bulkDeleteSubscribers(Request $request)
    {
        $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'integer|exists:newsletter_subscribers,id',
        ]);

        NewsletterSubscriber::whereIn('id', $request->ids)->delete();

        return response()->json([
            'message' => count($request->ids) . ' abonné(s) supprimé(s) avec succès.',
        ]);
    }
}
