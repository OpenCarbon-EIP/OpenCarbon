import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_poc/core/constants/app_constants.dart';
import 'package:flutter_poc/core/errors/app_errors.dart';
import 'package:flutter_poc/features/offers/data/models/offer_model.dart';
import 'package:http/http.dart' as http;

class OfferApiService {
  OfferApiService(this._httpClient);

  final http.Client _httpClient;

  Future<OfferModel> getOffers(String token) async {
    final String? dbPath = dotenv.env[AppConstants.dbPath];
    if (dbPath == null) {
      throw EnvironmentFailure();
    }
    final uri = Uri.http(dbPath, '/offers/list');
    final response = await _httpClient.get(
      uri,
      headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
    );

    if (response.statusCode != 200) {
      switch (response.statusCode) {
        case 401:
          throw AuthFailure("Vous n'êtes pas autorisé(e) à voir les offres.");
        default:
          throw Exception('Erreur pendant le chargement des opportunités');
      }
    }

    final decoded = json.decode(response.body) as Map<String, dynamic>;

    return OfferModel.fromJson(decoded);
  }

  Future<void> apply(String token, String idOffer) async {
    final String? dbPath = dotenv.env[AppConstants.dbPath];
    if (dbPath == null) {
      throw EnvironmentFailure();
    }
    final uri = Uri.http(dbPath, '/applications');
    final encodedBody = json.encode({'id_offer': idOffer, 'content': 'Je suis intéressé.'});

    final response = await _httpClient.post(
      uri,
      headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
      body: encodedBody,
    );

    switch (response.statusCode) {
      case 201:
        return;
      case 401:
        throw UnauthorizedFailure();
      case 403:
        throw AuthFailure();
      case 404:
        throw NotFoundFailure("Votre utilisateur ou compte consultant n'a pas été trouvé. Merci de vous reconnecter.");
      default:
        throw Exception('Une erreur inattendue est survenue lors de la candidature.');
    }
  }

  Future<OfferModel> getCompanyOffers(String token) async {
    final String? dbPath = dotenv.env[AppConstants.dbPath];
    if (dbPath == null) {
      throw EnvironmentFailure();
    }
    final uri = Uri.http(dbPath, '/offers/my-offers');
    final response = await _httpClient.get(
      uri,
      headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
    );

    if (response.statusCode != 200) {
      switch (response.statusCode) {
        case 401:
          throw AuthFailure("Vous n'êtes pas autorisé(e) à voir les offres.");
        case 404:
          throw NotFoundFailure("L'entreprise n'a pas été trouvée. Merci de vous reconnecter.");
        default:
          throw Exception('Erreur pendant le chargement des opportunités');
      }
    }

    final decoded = json.decode(response.body) as Map<String, dynamic>;

    return OfferModel.fromJson(decoded);
  }

  Future<void> createOffer(String token, String title, String description, String location, double budget, DateTime deadline) async {
    final String? dbPath = dotenv.env[AppConstants.dbPath];
    if (dbPath == null) {
      throw EnvironmentFailure();
    }
    final uri = Uri.http(dbPath, '/offers/create');
    final bodyEncoded = jsonEncode({'title': title, 'description': description, 'location': location, 'budget': budget, 'deadline': deadline.toIso8601String()});
    final response = await _httpClient.post(
      uri,
      headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
      body: bodyEncoded
    );

    if (response.statusCode != 201) {
      switch (response.statusCode) {
        case 401:
          throw UnauthorizedFailure("Vous n'êtes pas autorisé(e) à créer une offre.");
        case 403:
          throw UnauthorizedFailure('Seulement les entreprises peuvent créer une offer.');
        default:
          throw Exception('Erreur pendant la création de l\'offre');
      }
    }
  }

  Future<void> deleteOffer(String token, String idOffer) async {
    final String? dbPath = dotenv.env[AppConstants.dbPath];
    if (dbPath == null) {
      throw EnvironmentFailure();
    }

    final uri = Uri.http(dbPath, '/offers/$idOffer/delete');
    final response = await _httpClient.delete(
        uri,
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'}
    );

    if (response.statusCode != 200) {
      switch (response.statusCode) {
        case 401:
          throw UnauthorizedFailure("Vous n'êtes pas autorisé(e) à supprimer une offre.");
        case 403:
          throw UnauthorizedFailure('Seulement les entreprises peuvent supprimer une offre.');
        case 404:
          throw NotFoundFailure("L'offre n'existe pas, impossible de supprimer.");
        default:
          throw Exception('Erreur pendant la suppression de l\'offre.');
      }
    }
  }
}
