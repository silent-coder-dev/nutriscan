package com.nutriscan.config;

import org.mindrot.jbcrypt.BCrypt;
import org.springframework.stereotype.Component;

@Component
public class PasswordEncoder {

    public String encode(String password){
        return BCrypt.hashpw(password , BCrypt.gensalt(10));
    }

    public boolean matches(String rawPassword, String encodedPassword){
        if(encodedPassword == null || rawPassword == null) return false;
        return BCrypt.checkpw(rawPassword , encodedPassword);
    }
}
