package com.productmanagement.repository;

import com.productmanagement.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {
    
    Page<Product> findByStatus(String status, Pageable pageable);
    
    Optional<Product> findByProductCode(String productCode);
    
    @Query("SELECT p FROM Product p WHERE p.status = :status ORDER BY p.createdAt DESC")
    List<Product> findByStatusOrderByCreatedAtDesc(@Param("status") String status);
    
    @Query("SELECT COUNT(p) FROM Product p WHERE p.status = :status")
    long countByStatus(@Param("status") String status);
    
    boolean existsByProductCode(String productCode);
}
