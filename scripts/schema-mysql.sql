
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `admin_view_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_view_tokens` (
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estudiante_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` bigint DEFAULT (unix_timestamp()),
  `expires_unix` bigint NOT NULL,
  PRIMARY KEY (`token`),
  KEY `idx_view_tokens_exp` (`expires_unix`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `chaside_resultados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chaside_resultados` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estudiante_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_unix` bigint NOT NULL,
  `version` int NOT NULL DEFAULT '1',
  `top_interes` varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL,
  `segundo_interes` varchar(8) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `top_aptitud` varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL,
  `intereses_json` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `aptitudes_json` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `respuestas_json` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `intento_numero` int DEFAULT NULL,
  `created_at` bigint DEFAULT (unix_timestamp()),
  PRIMARY KEY (`id`),
  KEY `idx_chaside_est` (`estudiante_id`),
  KEY `idx_chaside_fecha` (`fecha_unix`),
  CONSTRAINT `fk_chaside_est` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `estudiantes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `estudiantes` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `moodle_user_id` bigint NOT NULL,
  `moodle_user_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `moodle_user_email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `moodle_course_id` bigint DEFAULT NULL,
  `moodle_extra_json` text COLLATE utf8mb4_unicode_ci,
  `created_at` bigint DEFAULT (unix_timestamp()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_estudiantes_moodle_user` (`moodle_user_id`),
  KEY `idx_estudiantes_created` (`created_at`),
  KEY `idx_estudiantes_moodle` (`moodle_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `knox_authtoken`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `knox_authtoken` (
  `digest` char(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token_key` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created` bigint NOT NULL,
  `expiry` bigint NOT NULL,
  PRIMARY KEY (`digest`),
  KEY `idx_knox_user` (`user_id`),
  KEY `idx_knox_expiry` (`expiry`),
  CONSTRAINT `fk_knox_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `kuder_resultados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kuder_resultados` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estudiante_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_unix` bigint NOT NULL,
  `version` int NOT NULL DEFAULT '1',
  `top` varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ranking_json` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `scores_json` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `respuestas_json` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `verificacion` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL,
  `intento_numero` int DEFAULT NULL,
  `created_at` bigint DEFAULT (unix_timestamp()),
  PRIMARY KEY (`id`),
  KEY `idx_kuder_est` (`estudiante_id`),
  KEY `idx_kuder_top` (`top`),
  CONSTRAINT `fk_kuder_est` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `moodle_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `moodle_config` (
  `id` int NOT NULL,
  `moodle_domains` text COLLATE utf8mb4_unicode_ci,
  `chaside_cmid` bigint DEFAULT NULL,
  `mbti_cmid` bigint DEFAULT NULL,
  `kuder_cmid` bigint DEFAULT NULL,
  `course_id` bigint DEFAULT NULL,
  `updated_at` bigint DEFAULT (unix_timestamp()),
  `course_ids` text COLLATE utf8mb4_unicode_ci,
  `chaside_cmids` text COLLATE utf8mb4_unicode_ci,
  `mbti_cmids` text COLLATE utf8mb4_unicode_ci,
  `kuder_cmids` text COLLATE utf8mb4_unicode_ci,
  `referer_required` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  CONSTRAINT `ck_moodle_config_id` CHECK ((`id` = 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `personalidad_resultados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personalidad_resultados` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estudiante_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_unix` bigint NOT NULL,
  `version` int NOT NULL DEFAULT '1',
  `tipo` varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dimensiones_json` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `percentages_json` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `respuestas_json` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `intento_numero` int DEFAULT NULL,
  `created_at` bigint DEFAULT (unix_timestamp()),
  PRIMARY KEY (`id`),
  KEY `idx_pers_est` (`estudiante_id`),
  KEY `idx_pers_tipo` (`tipo`),
  CONSTRAINT `fk_pers_est` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `preguntas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `preguntas` (
  `test_codigo` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `version` int NOT NULL,
  `pregunta_id` int NOT NULL,
  `texto` text COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`test_codigo`,`version`,`pregunta_id`),
  KEY `idx_preguntas_version` (`test_codigo`,`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `reintentos_habilitados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reintentos_habilitados` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estudiante_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `test_codigo` enum('CHASIDE','PERSONALIDAD','KUDER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `habilitado_por` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `habilitado_en` bigint DEFAULT (unix_timestamp()),
  `motivo` text COLLATE utf8mb4_unicode_ci,
  `ventana_desde_unix` bigint DEFAULT NULL,
  `ventana_hasta_unix` bigint DEFAULT NULL,
  `usado` tinyint NOT NULL DEFAULT '0',
  `usado_en` bigint DEFAULT NULL,
  `resultado_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_reintentos_est` (`estudiante_id`,`test_codigo`),
  KEY `idx_reintentos_pendientes` (`estudiante_id`,`test_codigo`,`usado`),
  KEY `fk_reintentos_user` (`habilitado_por`),
  CONSTRAINT `fk_reintentos_est` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reintentos_user` FOREIGN KEY (`habilitado_por`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `test_versiones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_versiones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` enum('CHASIDE','PERSONALIDAD','KUDER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `version` int NOT NULL,
  `vigencia_desde` bigint NOT NULL,
  `activo` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_test_versiones_codigo_version` (`codigo`,`version`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('admin','docente') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'docente',
  `is_active` tinyint NOT NULL DEFAULT '1',
  `created_at` bigint DEFAULT (unix_timestamp()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

