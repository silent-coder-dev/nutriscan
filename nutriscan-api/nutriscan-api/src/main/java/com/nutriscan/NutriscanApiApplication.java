package com.nutriscan;

import com.nutriscan.util.DatabaseUrlResolver;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class NutriscanApiApplication {

	public static void main(String[] args) {
		// Render/Railway/Heroku give DATABASE_URL as postgresql://…; turn it into Spring's JDBC settings
		DatabaseUrlResolver.applyFromEnvironment(System.getenv());
		SpringApplication.run(NutriscanApiApplication.class, args);
	}

}
