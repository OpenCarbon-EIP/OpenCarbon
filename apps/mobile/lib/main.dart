import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_poc/core/auth/auth_provider.dart';
import 'package:flutter_poc/features/login/ui/login_view.dart';
import 'package:flutter_poc/features/main_page/ui/main_screen_view.dart';
import 'package:flutter_poc/features/register/ui/register_view.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:provider/provider.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

Future<void> main() async {
  bool isEnvLoaded = true;
  WidgetsFlutterBinding.ensureInitialized();
  const iosOptions = IOSOptions(accessibility: KeychainAccessibility.first_unlock);
  const storage = FlutterSecureStorage(iOptions: iosOptions);

  try {
    await dotenv.load();
  } on Exception catch (e) {
    isEnvLoaded = false;
    debugPrint('Warning: .env file not loaded: $e');
  }
  if (isEnvLoaded == false) {
    runApp(const Center(child: (Text('Warning: .env file not loaded'))));
  } else {
    runApp(ChangeNotifierProvider(create: (_) => AuthProvider(storage), child: const MainApp()));
  }
}

class MainApp extends StatelessWidget {
  const MainApp({super.key});

  @override
  Widget build(BuildContext context) => ShadApp.custom(
    themeMode: ThemeMode.light,
    darkTheme: ShadThemeData(brightness: Brightness.dark, colorScheme: const ShadSlateColorScheme.dark()),
    appBuilder: (context) => MaterialApp(
      theme: Theme.of(context),
      builder: (context, child) => ShadAppBuilder(child: child),
      home: const AuthWrapper(),
    ),
  );
}

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  bool showLogin = true;

  void toggleView() => setState(() => showLogin = !showLogin);

  @override
  Widget build(BuildContext context) => Consumer<AuthProvider>(
    builder: (context, auth, _) {
      if (!auth.isInitialized) {
        return const Scaffold(body: Center(child: CircularProgressIndicator()));
      }

      if (auth.isAuthenticated) {
        return const MainScreen();
      }

      return showLogin ? LoginView(onSwitch: toggleView) : RegisterView(onSwitch: toggleView);
    },
  );
}
