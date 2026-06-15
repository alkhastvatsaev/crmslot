package com.crmslot.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        ensureFirebaseInitialized();
        super.onCreate(savedInstanceState);
    }

    /** Fallback si google-services.json absent (parité iOS AppDelegate.swift). */
    private void ensureFirebaseInitialized() {
        if (!FirebaseApp.getApps(this).isEmpty()) {
            return;
        }
        FirebaseOptions options =
                new FirebaseOptions.Builder()
                        .setApplicationId("1:889606998232:android:851ccd32867fa1562dafad")
                        .setApiKey("AIzaSyB3gZyNTOmsDC6Iy1CoIjpL7sg6x1f8HXU")
                        .setProjectId("belgique-72708")
                        .setGcmSenderId("889606998232")
                        .setStorageBucket("belgique-72708.firebasestorage.app")
                        .build();
        FirebaseApp.initializeApp(this, options);
    }
}
