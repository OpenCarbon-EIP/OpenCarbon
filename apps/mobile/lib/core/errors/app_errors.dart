abstract class Failure implements Exception {
  const Failure(this.message);
  final String message;
  @override
  String toString() => message;
}

class ServerFailure extends Failure {
  ServerFailure([super.message = 'Erreur serveur']);
}

class NetworkFailure extends Failure {
  NetworkFailure([super.message = 'Pas de connexion internet']);
}

class AuthFailure extends Failure {
  AuthFailure([super.message = 'Session expirée ou invalide']);
}

class ValidationFailure extends Failure {
  ValidationFailure([super.message = 'La validation a été refusée']);
}

class UnauthorizedFailure extends Failure {
  UnauthorizedFailure([super.message = "Vous n'êtes pas autorisé à faire cette action"]);
}

class NotFoundFailure extends Failure {
  NotFoundFailure([super.message = "L'élément demandé n'existe pas"]);
}

class EnvironmentFailure extends Failure {
  EnvironmentFailure([super.message = "Une variable d'environnement n'est pas définie."]);
}

class OwnershipFailure extends Failure {
  OwnershipFailure([super.message = "Vous n'êtes pas le propriétaire de cette offre."]);
}