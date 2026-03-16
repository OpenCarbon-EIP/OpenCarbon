import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_poc/core/constants/app_constants.dart';
import 'package:flutter_poc/core/errors/app_errors.dart';
import 'package:flutter_poc/features/login/data/models/login_response_model.dart';
import 'package:http/http.dart' as http;

/*
*  login_api_service.dart
*  This file implements the LoginApiService class, which is responsible 
*  for making HTTP requests to the login endpoint of the API. 
*  
*  It uses the http package to send a POST request with the user's email and password, 
*  and it parses the response into a LoginResponseModel.
*/
class LoginApiService {
  LoginApiService(this._httpClient);

  final http.Client _httpClient;

  Future<LoginResponseModel> login(String email, String password) async {
    final String? pathToDB = dotenv.env[AppConstants.dbPath];
    if (pathToDB == null) {
      throw EnvironmentFailure();
    }
    final uri = Uri.http(pathToDB, '/auth/login');
    final response = await _httpClient.post(uri, body: {
      'email': email,
      'password': password,
    });

    if (response.statusCode != 200 && response.statusCode != 201) {
      switch (response.statusCode) {
        case 401:
          throw AuthFailure("L'email ou le mot de passe n'est pas bon");
        default:
          throw Exception('Erreur pendant la connexion');
      }
    }
    final data = json.decode(response.body);
    return LoginResponseModel.fromJson(data as Map<String, dynamic>);
  }
}
