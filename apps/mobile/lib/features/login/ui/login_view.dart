import 'package:flutter/material.dart';
import 'package:flutter_poc/core/auth/auth_provider.dart';
import 'package:flutter_poc/core/colors/app_colors.dart';
import 'package:flutter_poc/features/login/data/repositories/login_repository.dart';
import 'package:flutter_poc/features/login/data/services/login_api_service.dart';
import 'package:flutter_poc/features/login/data/services/login_auth_service.dart';
import 'package:flutter_poc/features/login/viewmodels/login_viewmodel.dart';
import 'package:flutter_poc/ui/widgets/button.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';

class LoginView extends StatelessWidget {
  const LoginView({super.key, required this.onSwitch});

  final VoidCallback onSwitch;

  @override
  Widget build(BuildContext context) => Provider<http.Client>(
    create: (_) => http.Client(),
    dispose: (_, client) => client.close(),
    child: ChangeNotifierProvider(
      create: (context) {
        const iosOptions = IOSOptions(accessibility: KeychainAccessibility.first_unlock);
        const auth = FlutterSecureStorage(iOptions: iosOptions);
        final service = LoginApiService(context.read<http.Client>());
        final authService = LoginAuthService(auth);
        final repository = LoginRepositoryImpl(service, authService);
        return LoginViewModel(repository);
      },
      child: _LoginViewBody(onSwitch: onSwitch),
    ),
  );
}

class _LoginViewBody extends StatefulWidget {
  const _LoginViewBody({required this.onSwitch});

  final VoidCallback onSwitch;

  @override
  State<_LoginViewBody> createState() => _LoginViewBodyState();
}

class _LoginViewBodyState extends State<_LoginViewBody> {
  late final TextEditingController _emailController;
  late final TextEditingController _passwordController;

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController();
    _passwordController = TextEditingController();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<LoginViewModel>();

    return Scaffold(
      body: SingleChildScrollView(
        child: Column(
          children: [
            SizedBox(height: MediaQuery.of(context).size.height * 0.4),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Column(
                children: [
                  TextField(
                    controller: _emailController,
                    decoration: const InputDecoration(labelText: 'Email'),
                  ),
                  TextField(
                    controller: _passwordController,
                    decoration: const InputDecoration(labelText: 'Mot de passe'),
                    obscureText: true,
                  ),
                  if (vm.error != null) Text(vm.error!, style: const TextStyle(color: Colors.red)),
                ],
              ),
            ),
            const SizedBox(height: 24),
            SafeArea(
              child: Column(
                children: [
                  vm.isLoading
                      ? const CircularProgressIndicator()
                      : SmallButton(
                          text: 'Se connecter',
                          color: AppColors.primaryLight,
                          onPressed: () async {
                            await vm.login(_emailController.text, _passwordController.text);
                            if (vm.error == null && context.mounted) {
                              await context.read<AuthProvider>().loginSuccess();
                            }
                          },
                        ),
                  const SizedBox(height: 16),
                  TextButton(
                    onPressed: vm.isLoading ? null : widget.onSwitch,
                    child: const Text("Vous n'avez pas encore de compte ? Rejoignez la communauté !"),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
