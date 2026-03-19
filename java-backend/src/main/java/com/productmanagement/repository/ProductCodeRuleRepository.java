package com.productmanagement.repository;

import com.productmanagement.entity.ProductCodeRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductCodeRuleRepository extends JpaRepository<ProductCodeRule, Long> {
    
    List<ProductCodeRule> findByIsActiveTrueOrderByCreatedAtDesc();
    
    List<ProductCodeRule> findAllByOrderByCreatedAtDesc();
}
