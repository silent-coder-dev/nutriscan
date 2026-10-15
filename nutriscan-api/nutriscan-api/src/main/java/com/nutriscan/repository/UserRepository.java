package com.nutriscan.repository;

import com.nutriscan.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User , Long> {


    // Check either by Email OR by Username (usernames cannot contain '@', so at most one match)
    @Query("SELECT u FROM User u WHERE LOWER(u.email) = LOWER(:identifier) OR LOWER(u.username) = LOWER(:identifier)")
    Optional<User> findByEmailOrUsername(@Param("identifier") String identifier);


    // Custom Query
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    // Scouts with at least one point, best first. Page size sets how many are returned.
    @Query("SELECT u FROM User u WHERE COALESCE(u.scoutScore, 0) > 0 " +
            "ORDER BY COALESCE(u.scoutScore, 0) DESC, COALESCE(u.uniqueDiscoveries, 0) DESC, u.id ASC")
    List<User> findLeaderboard(Pageable pageable);

    // Atomic increment so concurrent discoveries by the same user are never lost
    @Transactional
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE User u SET u.scoutScore = COALESCE(u.scoutScore, 0) + :points, " +
            "u.uniqueDiscoveries = COALESCE(u.uniqueDiscoveries, 0) + 1 WHERE u.id = :userId")
    int awardDiscovery(@Param("userId") Long userId, @Param("points") int points);
}
